import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-kiwify-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const webhookToken = Deno.env.get("KIWIFY_WEBHOOK_TOKEN");
    if (!webhookToken) {
      console.error("KIWIFY_WEBHOOK_TOKEN not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Validate token from header or body
    const headerToken = req.headers.get("x-kiwify-token");
    const bodyToken = body?.token;
    if (headerToken !== webhookToken && bodyToken !== webhookToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderStatus = body?.order_status;
    const customerEmail = body?.customer?.email?.toLowerCase()?.trim();

    if (!orderStatus || !customerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing order_status or customer.email" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let action = "none";

    // Find user by email via auth admin
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const authUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === customerEmail
    );

    if (
      orderStatus === "paid" ||
      orderStatus === "approved" ||
      orderStatus === "subscription.renewed"
    ) {
      action =
        orderStatus === "subscription.renewed" ? "renewed" : "activated";

      if (authUser) {
        await supabase
          .from("profiles")
          .update({
            is_premium: true,
            premium_since:
              orderStatus === "subscription.renewed"
                ? undefined
                : new Date().toISOString(),
            premium_plan: "trimestral",
            premium_expires_at: new Date(
              Date.now() + 93 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq("user_id", authUser.id);
      } else {
        // User not registered yet — save to pending
        await supabase.from("pending_premium").insert({
          email: customerEmail,
          status: orderStatus,
          premium_plan: "trimestral",
          kiwify_payload: body,
        });
        action = "pending";
      }
    } else if (
      orderStatus === "refunded" ||
      orderStatus === "chargedback" ||
      orderStatus === "cancelled"
    ) {
      action = "deactivated";

      if (authUser) {
        await supabase
          .from("profiles")
          .update({
            is_premium: false,
            premium_expires_at: new Date().toISOString(),
          })
          .eq("user_id", authUser.id);
      } else {
        // Mark any pending as cancelled
        await supabase.from("pending_premium").insert({
          email: customerEmail,
          status: orderStatus,
          premium_plan: "trimestral",
          kiwify_payload: body,
        });
        action = "pending_cancelled";
      }
    }

    console.log(
      `Kiwify webhook: ${action} for ${customerEmail} (status: ${orderStatus})`
    );

    return new Response(
      JSON.stringify({ success: true, email: customerEmail, action }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Kiwify webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

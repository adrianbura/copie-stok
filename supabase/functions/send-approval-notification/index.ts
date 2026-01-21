import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id: string;
  email: string;
  full_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-approval-notification called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, email, full_name }: NotificationRequest = await req.json();
    
    console.log("Processing approval notification for:", { user_id, email, full_name });

    // Get the approval token for this user
    const { data: pendingApproval, error: fetchError } = await supabase
      .from("pending_approvals")
      .select("approval_token")
      .eq("user_id", user_id)
      .single();

    if (fetchError || !pendingApproval) {
      console.error("Error fetching pending approval:", fetchError);
      throw new Error("Could not find pending approval for user");
    }

    const approvalToken = pendingApproval.approval_token;
    const approvalUrl = `${supabaseUrl}/functions/v1/approve-user?token=${approvalToken}`;
    
    console.log("Approval URL generated:", approvalUrl);

    // Send email to admin
    const adminEmail = "bura_adrian@yahoo.com";
    
    const emailResponse = await resend.emails.send({
      from: "PyroStock <onboarding@resend.dev>",
      to: [adminEmail],
      subject: "🔔 Cerere nouă de înregistrare - PyroStock",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .user-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .user-info p { margin: 8px 0; }
            .label { font-weight: bold; color: #6b7280; }
            .approve-btn { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px; }
            .approve-btn:hover { background: #16a34a; }
            .footer { padding: 15px; text-align: center; color: #6b7280; font-size: 12px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin-top: 15px; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔥 PyroStock</h1>
              <p style="margin: 10px 0 0 0;">Cerere nouă de înregistrare</p>
            </div>
            <div class="content">
              <p>Un utilizator nou dorește să se înregistreze în aplicația PyroStock.</p>
              
              <div class="user-info">
                <p><span class="label">Nume:</span> ${full_name || "Nespecificat"}</p>
                <p><span class="label">Email:</span> ${email}</p>
                <p><span class="label">Data cererii:</span> ${new Date().toLocaleString("ro-RO")}</p>
              </div>
              
              <p>Pentru a aproba acest utilizator și a-i permite accesul în aplicație, apasă butonul de mai jos:</p>
              
              <a href="${approvalUrl}" class="approve-btn">✅ Aprobă Utilizatorul</a>
              
              <div class="warning">
                ⚠️ <strong>Atenție:</strong> Dacă nu cunoști acest utilizator sau cererea pare suspectă, nu aproba accesul.
              </div>
            </div>
            <div class="footer">
              <p>Acest email a fost trimis automat de sistemul PyroStock.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-approval-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

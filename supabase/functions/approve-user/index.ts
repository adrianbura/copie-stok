import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("approve-user called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    
    console.log("Approval token received:", token);

    if (!token) {
      return new Response(
        generateHTML("Eroare", "Token de aprobare lipsă.", false),
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the pending approval by token
    const { data: pendingApproval, error: fetchError } = await supabase
      .from("pending_approvals")
      .select("*")
      .eq("approval_token", token)
      .single();

    if (fetchError || !pendingApproval) {
      console.error("Error fetching pending approval:", fetchError);
      return new Response(
        generateHTML("Eroare", "Token de aprobare invalid sau expirat.", false),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Check if already approved
    if (pendingApproval.approved_at) {
      return new Response(
        generateHTML("Deja Aprobat", `Utilizatorul ${pendingApproval.email} a fost deja aprobat anterior.`, true),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Approve the user - update profile
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ is_approved: true })
      .eq("user_id", pendingApproval.user_id);

    if (updateProfileError) {
      console.error("Error updating profile:", updateProfileError);
      throw new Error("Failed to approve user profile");
    }

    // Update pending approval record
    const { error: updateApprovalError } = await supabase
      .from("pending_approvals")
      .update({ 
        approved_at: new Date().toISOString()
      })
      .eq("id", pendingApproval.id);

    if (updateApprovalError) {
      console.error("Error updating pending approval:", updateApprovalError);
    }

    console.log("User approved successfully:", pendingApproval.email);

    return new Response(
      generateHTML(
        "Utilizator Aprobat! ✅", 
        `Utilizatorul <strong>${pendingApproval.full_name || pendingApproval.email}</strong> (${pendingApproval.email}) a fost aprobat cu succes și poate accesa acum aplicația PyroStock.`,
        true
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error: any) {
    console.error("Error in approve-user:", error);
    return new Response(
      generateHTML("Eroare", `A apărut o eroare: ${error.message}`, false),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
};

function generateHTML(title: string, message: string, success: boolean): string {
  const bgColor = success ? "#22c55e" : "#ef4444";
  const icon = success ? "✅" : "❌";
  
  return `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title} - PyroStock</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1f2937, #111827);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 450px;
          width: 100%;
          overflow: hidden;
        }
        .header {
          background: ${bgColor};
          color: white;
          padding: 30px;
          text-align: center;
        }
        .icon { font-size: 48px; margin-bottom: 10px; }
        .header h1 { font-size: 24px; font-weight: 600; }
        .content {
          padding: 30px;
          text-align: center;
        }
        .content p {
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: transform 0.2s;
        }
        .btn:hover { transform: scale(1.05); }
        .footer {
          padding: 15px;
          text-align: center;
          background: #f9fafb;
          color: #9ca3af;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="icon">${icon}</div>
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>${message}</p>
          <a href="https://artificiigroup.lovable.app" class="btn">🔥 Deschide PyroStock</a>
        </div>
        <div class="footer">
          PyroStock - Sistem de management pentru depozite pirotehnice
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);

"""
Workspace Invite Email Cloud Function
Sends invitation emails when users are invited to workspaces
"""

from firebase_functions import https_fn, options
from firebase_admin import firestore
from datetime import datetime
from typing import Dict, Any
import logging
import os

logger = logging.getLogger(__name__)


@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=[
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library-staging.web.app",
            "http://localhost:5173",
        ],
        cors_methods=["POST"]
    )
)
def send_workspace_invite_email(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Send workspace invitation email

    Args:
        invitationId: ID of the invitation document
        workspaceId: Workspace ID
        workspaceName: Name of the workspace
        inviteeEmail: Email address to invite
        role: Role being assigned
        message: Optional personal message

    Returns:
        Success status and message ID
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    try:
        # Get request data
        invitation_id = req.data.get('invitationId')
        workspace_id = req.data.get('workspaceId')
        workspace_name = req.data.get('workspaceName')
        invitee_email = req.data.get('inviteeEmail')
        role = req.data.get('role')
        message = req.data.get('message', '')

        if not all([invitation_id, workspace_id, workspace_name, invitee_email, role]):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message="Missing required fields"
            )

        # Get inviter info
        db = firestore.client()
        inviter_id = req.auth.uid
        inviter_doc = db.collection('users').document(inviter_id).get()
        inviter_name = "A team member"
        inviter_email = ""

        if inviter_doc.exists:
            inviter_data = inviter_doc.to_dict()
            inviter_name = inviter_data.get('displayName', inviter_data.get('email', 'A team member'))
            inviter_email = inviter_data.get('email', '')

        # Build accept URL
        base_url = os.environ.get('APP_URL', 'https://rag-prompt-library.web.app')
        accept_url = f"{base_url}/accept-invite/{invitation_id}"

        # Build email content
        subject = f"You've been invited to join {workspace_name} on EthosPrompt"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                .role-badge {{ display: inline-block; background: #e5e7eb; padding: 4px 12px; border-radius: 4px; font-weight: 600; text-transform: capitalize; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Workspace Invitation</h1>
                </div>
                <div class="content">
                    <p>Hi there!</p>

                    <p><strong>{inviter_name}</strong> has invited you to join <strong>{workspace_name}</strong> on EthosPrompt.</p>

                    <p>Your role: <span class="role-badge">{role}</span></p>

                    {f'<p><em>"{message}"</em></p>' if message else ''}

                    <p style="text-align: center;">
                        <a href="{accept_url}" class="button">Accept Invitation</a>
                    </p>

                    <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>

                    <p>If you don't have an account, you'll be prompted to create one when you accept.</p>
                </div>
                <div class="footer">
                    <p>EthosPrompt - AI Solutions & Digital Transformation</p>
                    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text = f"""
Workspace Invitation

Hi there!

{inviter_name} has invited you to join {workspace_name} on EthosPrompt.

Your role: {role}

{f'Message: "{message}"' if message else ''}

Accept the invitation here: {accept_url}

This invitation will expire in 7 days.

If you don't have an account, you'll be prompted to create one when you accept.

---
EthosPrompt - AI Solutions & Digital Transformation
If you didn't expect this invitation, you can safely ignore this email.
        """.strip()

        # Send email via Resend
        # Using lazy import to avoid cold start overhead
        from ..index import send_resend_email

        result = send_resend_email({
            'to': invitee_email,
            'subject': subject,
            'html': html,
            'text': text,
            'tags': [
                {'name': 'type', 'value': 'workspace_invitation'},
                {'name': 'workspace_id', 'value': workspace_id}
            ]
        })

        # Update invitation status
        db.collection('workspace_invitations').document(invitation_id).update({
            'emailSentAt': firestore.SERVER_TIMESTAMP,
            'emailStatus': 'sent'
        })

        logger.info(f"Sent workspace invite email to {invitee_email} for workspace {workspace_id}")

        return {
            'success': True,
            'message': 'Invitation email sent successfully'
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error sending workspace invite email: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to send invitation email: {str(e)}"
        )

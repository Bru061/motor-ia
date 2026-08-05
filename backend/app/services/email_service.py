import logging

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)

resend.api_key = settings.RESEND_API_KEY


def send_password_reset_email(to_email: str, nombre: str, reset_link: str) -> bool:
    """Envía el correo de recuperación de contraseña. Retorna True si se envió sin error."""

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Recupera tu contraseña</h2>
      <p>Hola {nombre or ''},</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en MotorIA.
      Si tú la solicitaste, haz clic en el siguiente botón:</p>
      <p style="margin: 24px 0;">
        <a href="{reset_link}"
           style="background:#4f46e5;color:#ffffff;padding:12px 20px;
                  border-radius:8px;text-decoration:none;display:inline-block;">
          Restablecer contraseña
        </a>
      </p>
      <p>Este enlace expira en {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutos.</p>
      <p>Si tú no solicitaste este cambio, puedes ignorar este correo.</p>
    </div>
    """

    try:
        resend.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": "Recupera tu contraseña — MotorIA",
            "html": html,
        })
        return True
    except Exception:
        logger.exception("Error enviando correo de recuperación de contraseña a %s", to_email)
        return False

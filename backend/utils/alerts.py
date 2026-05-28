import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()


def send_sms_alert(message: str):
    """
    Twilio SMS (optional)
    If Twilio not configured, it will return "not configured" safely.
    """
    try:
        from twilio.rest import Client

        sid = os.getenv("TWILIO_SID")
        auth = os.getenv("TWILIO_AUTH")
        twilio_phone = os.getenv("TWILIO_PHONE")
        alert_phone = os.getenv("ALERT_PHONE")

        if not sid or not auth or not twilio_phone or not alert_phone:
            return {"success": False, "message": "Twilio not configured"}

        client = Client(sid, auth)
        msg = client.messages.create(
            body=message,
            from_=twilio_phone,
            to=alert_phone
        )
        return {"success": True, "sid": msg.sid}

    except Exception as e:
        return {"success": False, "error": str(e)}


def send_email_alert(subject: str, body: str):
    """
    Gmail SMTP (App Password required)
    If SMTP not configured, it will return "not configured" safely.
    """
    try:
        sender = os.getenv("SMTP_EMAIL")
        password = os.getenv("SMTP_PASS")
        receiver = os.getenv("ALERT_EMAIL")

        if not sender or not password or not receiver:
            return {"success": False, "message": "SMTP not configured"}

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = receiver
        msg.set_content(body)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(sender, password)
            smtp.send_message(msg)

        return {"success": True}

    except Exception as e:
        return {"success": False, "error": str(e)}
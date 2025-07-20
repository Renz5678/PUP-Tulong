from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from dotenv import load_dotenv
import os

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS") == "True",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS") == "True",
    USE_CREDENTIALS=True
)

async def send_otp_email(email: EmailStr, otp: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f6f6f6;">
      <div style="max-width: 600px; margin: auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <h2 style="color: #cc0000;">PUP Tulong Email Verification</h2>
        <p>Hello,</p>
        <p>Thank you for registering with <strong>PUP Tulong</strong>.</p>
        <p>Please use the following One-Time Password (OTP) to verify your email address:</p>
        <h3 style="color: #333; letter-spacing: 2px;">{otp}</h3>
        <p>This OTP is valid for a short period and can only be used once.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br>
        <p style="font-size: 14px; color: #999;">— PUP Tulong Team</p>
      </div>
    </div>
    """

    message = MessageSchema(
        subject="Verify your email – PUP Tulong",
        recipients=[email],
        body=html,
        subtype=MessageType.html  # important for HTML format
    )

    fm = FastMail(conf)
    await fm.send_message(message)
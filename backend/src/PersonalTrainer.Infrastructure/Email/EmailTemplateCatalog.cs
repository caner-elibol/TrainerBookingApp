using PersonalTrainer.Application.Email;

namespace PersonalTrainer.Infrastructure.Email;

public static class EmailTemplateCatalog
{
    public static readonly IReadOnlyDictionary<EmailTemplateKey, (string Subject, string Body)> Templates =
        new Dictionary<EmailTemplateKey, (string, string)>
        {
            [EmailTemplateKey.EmailVerificationCode] = (
                "E-posta doğrulama kodunuz",
                """
                <p style="margin:0 0 16px;font-size:16px;font-weight:700;">E-posta doğrulama kodunuz</p>
                <p style="margin:0 0 20px;">Aşağıdaki kodu uygulamaya girerek e-posta adresinizi doğrulayabilirsiniz.</p>
                <p style="margin:0 0 20px;text-align:center;">
                  <span style="display:inline-block;padding:12px 24px;background-color:#eef0ff;color:#3a3db3;font-size:28px;font-weight:800;letter-spacing:4px;border-radius:12px;">{{Code}}</span>
                </p>
                <p style="margin:0;color:#667085;font-size:13px;">Bu kod {{ExpiryMinutes}} dakika geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
                """),

            [EmailTemplateKey.AppointmentCreatedForClient] = (
                "Yeni randevunuz oluşturuldu",
                """
                <p style="margin:0 0 16px;font-size:16px;font-weight:700;">Merhaba {{ClientName}},</p>
                <p style="margin:0 0 12px;">{{TrainerName}} sizin için yeni bir randevu oluşturdu.</p>
                <p style="margin:0 0 20px;padding:16px;background-color:#f7f8fc;border-radius:12px;">
                  <strong>Tarih:</strong> {{Date}}<br/>
                  <strong>Saat:</strong> {{Time}}
                </p>
                <p style="margin:0;color:#667085;font-size:13px;">Kalan seans hakkınız: {{RemainingSessions}}</p>
                """),

            [EmailTemplateKey.AppointmentCreatedForTrainer] = (
                "Randevu oluşturuldu",
                """
                <p style="margin:0 0 16px;font-size:16px;font-weight:700;">Merhaba {{TrainerName}},</p>
                <p style="margin:0 0 12px;"><strong>{{ClientName}}</strong> için bir randevu oluşturuldu.</p>
                <p style="margin:0;padding:16px;background-color:#f7f8fc;border-radius:12px;">
                  <strong>Tarih:</strong> {{Date}}<br/>
                  <strong>Saat:</strong> {{Time}}
                </p>
                """),

            [EmailTemplateKey.AppointmentCancelledForClient] = (
                "Randevunuz iptal edildi",
                """
                <p style="margin:0 0 16px;font-size:16px;font-weight:700;">Merhaba {{ClientName}},</p>
                <p style="margin:0 0 12px;">{{CancelledBy}} tarafından aşağıdaki randevu iptal edildi.</p>
                <p style="margin:0 0 12px;padding:16px;background-color:#f7f8fc;border-radius:12px;">
                  <strong>Antrenör:</strong> {{TrainerName}}<br/>
                  <strong>Tarih:</strong> {{Date}}<br/>
                  <strong>Saat:</strong> {{Time}}
                </p>
                <p style="margin:0;color:#667085;font-size:13px;">{{RefundNote}}</p>
                """),

            [EmailTemplateKey.AppointmentCancelledForTrainer] = (
                "Randevu iptal edildi",
                """
                <p style="margin:0 0 16px;font-size:16px;font-weight:700;">Merhaba {{TrainerName}},</p>
                <p style="margin:0 0 12px;">{{CancelledBy}} tarafından aşağıdaki randevu iptal edildi.</p>
                <p style="margin:0;padding:16px;background-color:#f7f8fc;border-radius:12px;">
                  <strong>Danışan:</strong> {{ClientName}}<br/>
                  <strong>Tarih:</strong> {{Date}}<br/>
                  <strong>Saat:</strong> {{Time}}
                </p>
                """),

            [EmailTemplateKey.DayCancelledForClient] = (
                "Randevunuz iptal edildi",
                """
                <p style="margin:0 0 16px;font-size:16px;font-weight:700;">Merhaba {{ClientName}},</p>
                <p style="margin:0 0 12px;">{{TrainerName}}, aşağıdaki randevunuzu iptal etti.</p>
                <p style="margin:0 0 12px;padding:16px;background-color:#f7f8fc;border-radius:12px;">
                  <strong>Tarih:</strong> {{Date}}<br/>
                  <strong>Saat:</strong> {{Time}}
                </p>
                <p style="margin:0;color:#667085;font-size:13px;">Seans hakkınız paketinize iade edildi.</p>
                """),

            [EmailTemplateKey.PackagePurchasedForClient] = (
                "Paket satın alımınız tamamlandı",
                """
                <p style="margin:0 0 16px;font-size:16px;font-weight:700;">Merhaba {{ClientName}},</p>
                <p style="margin:0 0 12px;"><strong>{{PackageName}}</strong> paketi satın alımınız tamamlandı.</p>
                <p style="margin:0;padding:16px;background-color:#f7f8fc;border-radius:12px;">
                  <strong>Seans sayısı:</strong> {{SessionCount}}<br/>
                  <strong>Tutar:</strong> {{Amount}}
                </p>
                """),

            [EmailTemplateKey.PackagePurchasedForTrainer] = (
                "Paket satın alındı",
                """
                <p style="margin:0 0 16px;font-size:16px;font-weight:700;">Merhaba {{TrainerName}},</p>
                <p style="margin:0 0 12px;"><strong>{{ClientName}}</strong>, <strong>{{PackageName}}</strong> paketini satın aldı.</p>
                <p style="margin:0;padding:16px;background-color:#f7f8fc;border-radius:12px;">
                  <strong>Tutar:</strong> {{Amount}}
                </p>
                """),

            [EmailTemplateKey.PackageAssignedForClient] = (
                "Size yeni bir paket tanımlandı",
                """
                <p style="margin:0 0 16px;font-size:16px;font-weight:700;">Merhaba {{ClientName}},</p>
                <p style="margin:0 0 12px;">{{TrainerName}} size <strong>{{PackageName}}</strong> paketini tanımladı.</p>
                <p style="margin:0;padding:16px;background-color:#f7f8fc;border-radius:12px;">
                  <strong>Seans sayısı:</strong> {{SessionCount}}
                </p>
                """),

            [EmailTemplateKey.PaymentReceivedForClient] = (
                "Ödemeniz alındı",
                """
                <p style="margin:0 0 16px;font-size:16px;font-weight:700;">Merhaba {{ClientName}},</p>
                <p style="margin:0 0 12px;"><strong>{{PackageName}}</strong> paketi için ödemeniz alındı.</p>
                <p style="margin:0;padding:16px;background-color:#f7f8fc;border-radius:12px;">
                  <strong>Tutar:</strong> {{Amount}}<br/>
                  <strong>Yöntem:</strong> {{Method}}
                </p>
                """),
        };

    public static string WrapLayout(string bodyHtml) =>
        $$"""
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="margin:0;padding:0;background-color:#f7f8fc;font-family:'Manrope',system-ui,-apple-system,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f8fc;padding:24px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(17,24,39,0.08);">
                  <tr>
                    <td style="background-color:#5b5ff5;padding:20px 28px;">
                      <span style="color:#ffffff;font-size:18px;font-weight:700;">PersonalTrainer</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px;color:#111827;font-size:15px;line-height:1.6;">
                      {{bodyHtml}}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 28px;background-color:#f7f8fc;color:#98a2b3;font-size:12px;">
                      Bu e-posta PersonalTrainer tarafından otomatik olarak gönderilmiştir.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;
}

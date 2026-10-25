import qrcode, urllib.parse
from qrcode.constants import ERROR_CORRECT_H
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.colormasks import SolidFillColorMask
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
from PIL import Image

BASE = 'https://julianjuarezmx01.github.io/cantabria-pms-demo'
AZUL = (26, 62, 109)
CREMA = (242, 232, 213)

WA = 'https://wa.me/527757591185?text=' + urllib.parse.quote('Hola Hotel Cantabria, vengo del QR de la fachada. Necesito información.')
QRS = {
    'fachada-info': BASE + '/',
    'contacto': BASE + '/contacto.vcf',
    'whatsapp': WA,
    'recepcion-reservas': BASE + '/#reservar',
    'habitacion-concierge': BASE + '/#concierge',
}

logo = Image.open('public/brand/monograma-promo.webp').convert('RGB').resize((160, 160))

for name, url in QRS.items():
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=24, border=3)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        color_mask=SolidFillColorMask(back_color=CREMA, front_color=AZUL),
        embeded_image=logo,
    )
    img.save(f'public/qr/{name}.png')
    print(name, img.size)

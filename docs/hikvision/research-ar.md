# مراجع منتجات Hikvision — أفق البصرة

تاريخ الجمع: 30 سبتمبر 2026. أربع نشرات PDF أصلية التصميم والمحتوى من Hikvision، نُزّلت من مواقع موزعين بسبب انتهاء مهلة الاتصال بخوادم Hikvision من هذا الجهاز. راجع public/datasheets/hikvision/sources.json لمصدر التنزيل الفعلي والمرجع الرسمي وبصمة كل ملف. لم تُثبت مطابقة البايتات مع نسخ الخادم الرسمي، ولم يُفترض أنها أحدث مراجعة لجميع الأسواق.

## معلومات مقترحة لصفحة الهبوط

| الجهاز | أبرز المعلومات من الداتا شيت المحفوظة |
|---|---|
| ColorVu Bullet — DS-2CD2T87G3-LIS2UY/SL | 8MP بدقة 3840×2160، ColorVu، عدسة F1.0، إضاءة هجينة IR وبيضاء حتى 60م، صوت باتجاهين، IP67. |
| Panoramic Turret — DS-2CD2387G2P-LSU/SL | فئة 8MP بانورامية بدقة 5120×1440، عدستان 4mm، مجال أفقي 180° ±10°، ColorVu، تنبيه ضوئي وصوتي، IP67. |
| TandemVu — DS-2SE7C432MW-AEB(14F1)(P3) | قناة ثابتة 4MP وقناة PTZ بدقة 4MP، تقريب بصري 32×، أشعة تحت حمراء لقناة PTZ حتى 200م، إضاءة بيضاء للقناة الثابتة حتى 30م. |
| AcuSense NVR — DS-7608NXI-K2 | 8 قنوات IP، دخل بيانات 80Mbps، إخراج HDMI حتى 4K، منفذا SATA حتى 10TB لكل قرص وفق هذه المراجعة، ضغط H.265+. |

## ملاحظات المطابقة قبل النشر

- Bullet: ملف العائلة يتضمن صراحة /SL(4mm)، وهو كود قائمة الشركة. /SL بوميض أبيض؛ لا ننسب له الوميض الأحمر والأزرق الخاص بـ /SRB. تصنيف مقاومة التآكل متوسط؛ لا تسوّق كحماية متخصصة للموانئ أو المصانع الكيميائية.
- Panoramic: النسخة المحفوظة تسمي DS-2CD2387G2P-LSU/SL(4mm) وتذكر إضاءة حتى 30م. لا نخلطها مع نشرات إقليمية تذكر 40م أو نسخة (C)/Black. معدل الإطارات يتأثر بتشغيل WDR. الوصف التسويقي 8MP لا يعني 3840×2160؛ الدقة الفعلية مذكورة أعلاه.
- PTZ: يجب المحافظة على اللاحقة (14F1)(P3). تقريب 32× يخص القناة المتحركة، ومدى IR ليس مسافة مضمونة للتعرف على الوجوه.
- NVR: الملف المحفوظ مراجعة 20231021، والمرجع الرسمي المتاح للمقارنة 20230209. يخص K2 دون /8P أو (D) أو (E) أو VPro. لا ننسب إليه منافذ PoE مدمجة. يلزم مطابقة ملصق المخزون إذا كانت هناك لاحقة غير ظاهرة في عنوان منتج الموقع.
- هذه المراجع لا تثبت المخزون الحالي أو سعر البيع. التوافق بين الكاميرا البانورامية والمسجل وإصدار البرنامج يجب التحقق منه قبل تسويقها كحزمة.

## المصادر والملفات

### DS-2CD2T87G3-LIS2UY/SL(4mm)

- [الملف المحلي](../../public/datasheets/hikvision/DS-2CD2T87G3-LIS2UY-SLRB_20250411.pdf) — 7 صفحات.
- [مصدر التنزيل](https://www.usacompua.com/cdn/shop/files/DS-2CD2T87G3-LIS2UY_SLRB_Datasheet_20250411.pdf?v=5646253660649599785).
- [مرجع Hikvision الرسمي](https://assets.hikvision.com/prd/public/all/doc/m000144460/DS-2CD2T87G3-LIS2UY_SLRB_Datasheet_20250411.pdf).

### DS-2CD2387G2P-LSU/SL(4mm)

- [الملف المحلي](../../public/datasheets/hikvision/DS-2CD2387G2P-LSU-SL.pdf) — 7 صفحات.
- [مصدر التنزيل](https://www.pyramid.lt/images/Userfiles/files/8f3000bf3f788ee6a55320d4dc370eb6.pdf).
- [مرجع Hikvision الرسمي](https://pro-av.hikvision.com/au-en/products/IP-Products/Network-Cameras/Pro-Series-EasyIP-/ds-2cd2387g2p-lsu-sl/).

### DS-2SE7C432MW-AEB(14F1)(P3)

- [الملف المحلي](../../public/datasheets/hikvision/DS-2SE7C432MW-AEB-14F1-P3_20250522.pdf) — 9 صفحات.
- [مصدر التنزيل](https://dolinkegypt.com/en/shop/hikvision-tandemvu-4-4mp-32x-colorvu-ir-acusense-network-speed-dome-ds-2se7c432mw-aeb-14f1-p3-382/document/324).
- [مرجع Hikvision الرسمي](https://assets.hikvision.com/prd/normal/all/doc/m000056249/DS-2SE7C432MW-AEB14F1P3_Datasheet_20250522.pdf).

### DS-7608NXI-K2

- [الملف المحلي](../../public/datasheets/hikvision/DS-7608NXI-K2_20231021.pdf) — 5 صفحات.
- [مصدر التنزيل](https://subpreecha.co.th/wp-content/uploads/2025/10/Datasheet-of-DS-7608NXI-K2_V4.74.000_20231021.pdf).
- [مرجع Hikvision الرسمي](https://www.hikvision.com/content/dam/hikvision/products/S000000001/S000000002/S000000007/S000000026/OFR000042/M000058887/Data_Sheet/Datasheet-of-DS-7608NXI-K2_V4.74.000_20230209.pdf).


## صور القسم

صور الكاميرات الأصلية من الكتالوج العام للموقع، وروابطها في catalog-images.json. صورة NVR مستخرجة من أول صفحة للداتا شيت. صورة campaign.webp مشهد ترويجي مولّد باستخدام صور الأجهزة الأربعة كمراجع؛ صور تفاصيل المنتجات هي الصور الأصلية.

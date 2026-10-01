export type EnergyText = { ar: string; en: string };
export type EnergyProduct = {
  id: string; model: string; choice: string; series: string; image: string; pdf?: string;
  power: string; unit: string; summary: EnergyText;
  specs: { label: EnergyText; value: string }[]; note: EnergyText;
};
// Source files and model mappings: docs/energy/sources.md.
export const energyInverters: EnergyProduct[] = [
  {
    "id": "385ec4c5-7fcf-4edc-ba68-ddaf313237dc",
    "model": "PV18-6048 ECO",
    "choice": "ECO · 6 kW",
    "series": "PV1800 ECO",
    "image": "/images/energy/must-eco.webp",
    "pdf": "/datasheets/energy/must-eco.pdf",
    "power": "6",
    "unit": "kW",
    "summary": {
      "ar": "عاكس بشاحن شمسي MPPT ومخرجين لإدارة الأحمال، مع اتصال CAN لبطاريات الليثيوم.",
      "en": "An inverter with MPPT solar charging, dual outputs for load management and CAN communication for lithium batteries."
    },
    "specs": [
      {
        "label": {
          "ar": "القدرة الاسمية",
          "en": "Rated output"
        },
        "value": "6000 W"
      },
      {
        "label": {
          "ar": "في وضع البطارية",
          "en": "Battery-mode output"
        },
        "value": "5500 W"
      },
      {
        "label": {
          "ar": "نظام البطارية",
          "en": "Battery system"
        },
        "value": "48 VDC"
      },
      {
        "label": {
          "ar": "أقصى شحن شمسي",
          "en": "Max. solar charge"
        },
        "value": "100 A"
      },
      {
        "label": {
          "ar": "أقصى جهد ألواح مفتوح",
          "en": "Max. PV open-circuit voltage"
        },
        "value": "450 VDC"
      },
      {
        "label": {
          "ar": "شكل الموجة",
          "en": "Waveform"
        },
        "value": "Pure sine wave"
      }
    ],
    "note": {
      "ar": "القدرة الاسمية 6kW؛ قدرة الخرج في وضع البطارية 5.5kW وفق الداتا شيت.",
      "en": "Rated at 6kW; battery-mode output is 5.5kW according to the datasheet."
    }
  },
  {
    "id": "e70b2a0d-adef-4bfe-9c14-839483ebbc48",
    "model": "PH19-4024 EXP",
    "choice": "EXP · 4 kW",
    "series": "PH1900 EXP",
    "image": "/images/energy/must-exp-4-6.webp",
    "pdf": "/datasheets/energy/must-exp-4-6.pdf",
    "power": "4",
    "unit": "kW",
    "summary": {
      "ar": "عاكس هجين بموجة جيبية نقية ومخرجين لإدارة الأحمال. شاحن MPPT مدمج واتصال BMS لبطاريات الليثيوم.",
      "en": "A hybrid pure sine wave inverter with dual outputs for load management. Built-in MPPT charging and lithium battery BMS communication."
    },
    "specs": [
      {
        "label": {
          "ar": "القدرة الاسمية",
          "en": "Rated output"
        },
        "value": "4000 W"
      },
      {
        "label": {
          "ar": "نظام البطارية",
          "en": "Battery system"
        },
        "value": "24 VDC"
      },
      {
        "label": {
          "ar": "أقصى قدرة ألواح",
          "en": "Max. PV array power"
        },
        "value": "5000 W"
      },
      {
        "label": {
          "ar": "أقصى شحن شمسي",
          "en": "Max. solar charge"
        },
        "value": "100 A"
      },
      {
        "label": {
          "ar": "أقصى جهد ألواح مفتوح",
          "en": "Max. PV open-circuit voltage"
        },
        "value": "500 VDC"
      },
      {
        "label": {
          "ar": "عدد متتبّعات MPPT",
          "en": "MPPT trackers"
        },
        "value": "1"
      }
    ],
    "note": {
      "ar": "التوازي يتطلب نسخة تدعم التوازي. المراقبة عبر Wi-Fi اختيارية.",
      "en": "Parallel operation requires a parallel-capable model. Wi-Fi monitoring is optional."
    }
  },
  {
    "id": "de6ccde7-149e-4226-90f2-256c53487d9f",
    "model": "PH19-6048 EXP",
    "choice": "EXP · 6 kW",
    "series": "PH1900 EXP",
    "image": "/images/energy/must-exp-4-6.webp",
    "pdf": "/datasheets/energy/must-exp-4-6.pdf",
    "power": "6",
    "unit": "kW",
    "summary": {
      "ar": "عاكس هجين بموجة جيبية نقية ومخرجين لإدارة الأحمال. شاحن MPPT مدمج واتصال BMS لبطاريات الليثيوم.",
      "en": "A hybrid pure sine wave inverter with dual outputs for load management. Built-in MPPT charging and lithium battery BMS communication."
    },
    "specs": [
      {
        "label": {
          "ar": "القدرة الاسمية",
          "en": "Rated output"
        },
        "value": "6000 W"
      },
      {
        "label": {
          "ar": "نظام البطارية",
          "en": "Battery system"
        },
        "value": "48 VDC"
      },
      {
        "label": {
          "ar": "أقصى قدرة ألواح",
          "en": "Max. PV array power"
        },
        "value": "6000 W"
      },
      {
        "label": {
          "ar": "أقصى شحن شمسي",
          "en": "Max. solar charge"
        },
        "value": "120 A"
      },
      {
        "label": {
          "ar": "أقصى جهد ألواح مفتوح",
          "en": "Max. PV open-circuit voltage"
        },
        "value": "500 VDC"
      },
      {
        "label": {
          "ar": "عدد متتبّعات MPPT",
          "en": "MPPT trackers"
        },
        "value": "1"
      }
    ],
    "note": {
      "ar": "التوازي يتطلب نسخة تدعم التوازي. المراقبة عبر Wi-Fi اختيارية.",
      "en": "Parallel operation requires a parallel-capable model. Wi-Fi monitoring is optional."
    }
  },
  {
    "id": "2a2d2a50-be8c-437f-b142-e05cfbecd0f1",
    "model": "PH19-8048 EXP",
    "choice": "EXP · 8 kW",
    "series": "PH1900 EXP",
    "image": "/images/energy/must-exp-8-10.webp",
    "pdf": "/datasheets/energy/must-exp-8-10.pdf",
    "power": "8",
    "unit": "kW",
    "summary": {
      "ar": "عاكس هجين بموجة جيبية نقية ومخرجين لإدارة الأحمال. متتبّعا MPPT للاستفادة من مدخلي الألواح الشمسية.",
      "en": "A hybrid pure sine wave inverter with dual outputs for load management. Two MPPT trackers manage separate solar inputs."
    },
    "specs": [
      {
        "label": {
          "ar": "القدرة الاسمية",
          "en": "Rated output"
        },
        "value": "8000 W"
      },
      {
        "label": {
          "ar": "نظام البطارية",
          "en": "Battery system"
        },
        "value": "48 VDC"
      },
      {
        "label": {
          "ar": "أقصى قدرة ألواح",
          "en": "Max. PV array power"
        },
        "value": "8000 W"
      },
      {
        "label": {
          "ar": "أقصى شحن شمسي",
          "en": "Max. solar charge"
        },
        "value": "120 A"
      },
      {
        "label": {
          "ar": "أقصى جهد ألواح مفتوح",
          "en": "Max. PV open-circuit voltage"
        },
        "value": "500 VDC"
      },
      {
        "label": {
          "ar": "عدد متتبّعات MPPT",
          "en": "MPPT trackers"
        },
        "value": "2"
      }
    ],
    "note": {
      "ar": "التوازي يتطلب نسخة تدعم التوازي. الحد الأقصى لجهد الألواح عند التوازي 450V.",
      "en": "Parallel operation requires a parallel-capable model. Maximum PV voltage is 450V in parallel operation."
    }
  },
  {
    "id": "f5568ed4-289e-476e-b90d-a86a713aaa80",
    "model": "PH19-10048 EXP",
    "choice": "EXP · 10 kW",
    "series": "PH1900 EXP",
    "image": "/images/energy/must-exp-8-10.webp",
    "pdf": "/datasheets/energy/must-exp-8-10.pdf",
    "power": "10",
    "unit": "kW",
    "summary": {
      "ar": "عاكس هجين بموجة جيبية نقية ومخرجين لإدارة الأحمال. متتبّعا MPPT للاستفادة من مدخلي الألواح الشمسية.",
      "en": "A hybrid pure sine wave inverter with dual outputs for load management. Two MPPT trackers manage separate solar inputs."
    },
    "specs": [
      {
        "label": {
          "ar": "القدرة الاسمية",
          "en": "Rated output"
        },
        "value": "10000 W"
      },
      {
        "label": {
          "ar": "نظام البطارية",
          "en": "Battery system"
        },
        "value": "48 VDC"
      },
      {
        "label": {
          "ar": "أقصى قدرة ألواح",
          "en": "Max. PV array power"
        },
        "value": "10000 W"
      },
      {
        "label": {
          "ar": "أقصى شحن شمسي",
          "en": "Max. solar charge"
        },
        "value": "150 A"
      },
      {
        "label": {
          "ar": "أقصى جهد ألواح مفتوح",
          "en": "Max. PV open-circuit voltage"
        },
        "value": "500 VDC"
      },
      {
        "label": {
          "ar": "عدد متتبّعات MPPT",
          "en": "MPPT trackers"
        },
        "value": "2"
      }
    ],
    "note": {
      "ar": "التوازي يتطلب نسخة تدعم التوازي. الحد الأقصى لجهد الألواح عند التوازي 450V.",
      "en": "Parallel operation requires a parallel-capable model. Maximum PV voltage is 450V in parallel operation."
    }
  },
  {
    "id": "9494ade6-5a65-436e-878d-2234ac85da57",
    "model": "PH11-6048 PRO",
    "choice": "PRO · 6 kW",
    "series": "PH1100 PRO",
    "image": "/images/energy/must-pro.webp",
    "pdf": "/datasheets/energy/must-pro.pdf",
    "power": "6",
    "unit": "kW",
    "summary": {
      "ar": "عاكس هجين أحادي الطور بدرجة حماية IP66، بتبريد طبيعي دون مروحة ومتتبّعي MPPT.",
      "en": "A single-phase hybrid inverter with IP66 protection, fanless natural cooling and two MPPT trackers."
    },
    "specs": [
      {
        "label": {
          "ar": "القدرة الاسمية",
          "en": "Rated output"
        },
        "value": "6000 W"
      },
      {
        "label": {
          "ar": "نظام البطارية",
          "en": "Battery system"
        },
        "value": "48 V"
      },
      {
        "label": {
          "ar": "درجة الحماية",
          "en": "Ingress protection"
        },
        "value": "IP66"
      },
      {
        "label": {
          "ar": "نطاق MPPT",
          "en": "MPPT range"
        },
        "value": "120–500 V"
      },
      {
        "label": {
          "ar": "أقصى تيار شحن",
          "en": "Max. charging current"
        },
        "value": "125 A"
      },
      {
        "label": {
          "ar": "عدد متتبّعات MPPT",
          "en": "MPPT trackers"
        },
        "value": "2"
      }
    ],
    "note": {
      "ar": "تنخفض القدرة فوق 45°C وفق شروط التشغيل في الداتا شيت.",
      "en": "Output is derated above 45°C, as specified in the datasheet."
    }
  }
];
export const energyBatteries: EnergyProduct[] = [
  {
    "id": "e7bb5f3e-baa0-45de-a797-27b258423a91",
    "model": "LP16-24200",
    "choice": "5.12 kWh",
    "series": "LP1600 · LiFePO₄",
    "image": "/images/energy/must-lp1600.webp",
    "pdf": "/datasheets/energy/must-lp1600.pdf",
    "power": "5.12",
    "unit": "kWh",
    "summary": {
      "ar": "تخزين بتقنية فوسفات حديد الليثيوم، مع BMS مدمج ومراقبة عبر Wi-Fi واتصال CAN وRS485.",
      "en": "Lithium iron phosphate storage with integrated BMS, Wi-Fi monitoring, and CAN and RS485 communication."
    },
    "specs": [
      {
        "label": {
          "ar": "الطاقة الاسمية",
          "en": "Nominal energy"
        },
        "value": "5.12 kWh"
      },
      {
        "label": {
          "ar": "الجهد الاسمي",
          "en": "Nominal voltage"
        },
        "value": "25.6 V"
      },
      {
        "label": {
          "ar": "السعة",
          "en": "Capacity"
        },
        "value": "200 Ah"
      },
      {
        "label": {
          "ar": "أقصى تيار مستمر",
          "en": "Max. continuous current"
        },
        "value": "150 A"
      },
      {
        "label": {
          "ar": "درجة الحماية",
          "en": "Ingress protection"
        },
        "value": "IP21"
      },
      {
        "label": {
          "ar": "التوسعة بالتوازي",
          "en": "Parallel expansion"
        },
        "value": "15 units max."
      }
    ],
    "note": {
      "ar": "6000 دورة عند عمق تفريغ 80% وحرارة 25°C وفق اختبار الشركة. يُراجع توافق العاكس قبل الربط.",
      "en": "6000 cycles at 80% depth of discharge and 25°C per manufacturer testing. Confirm inverter compatibility before connection."
    }
  },
  {
    "id": "730afb76-2c08-49fa-9dfa-c45735f0d1fa",
    "model": "LP16-48200",
    "choice": "10.24 kWh",
    "series": "LP1600 · LiFePO₄",
    "image": "/images/energy/must-lp1600.webp",
    "pdf": "/datasheets/energy/must-lp1600.pdf",
    "power": "10.24",
    "unit": "kWh",
    "summary": {
      "ar": "تخزين بتقنية فوسفات حديد الليثيوم، مع BMS مدمج ومراقبة عبر Wi-Fi واتصال CAN وRS485.",
      "en": "Lithium iron phosphate storage with integrated BMS, Wi-Fi monitoring, and CAN and RS485 communication."
    },
    "specs": [
      {
        "label": {
          "ar": "الطاقة الاسمية",
          "en": "Nominal energy"
        },
        "value": "10.24 kWh"
      },
      {
        "label": {
          "ar": "الجهد الاسمي",
          "en": "Nominal voltage"
        },
        "value": "51.2 V"
      },
      {
        "label": {
          "ar": "السعة",
          "en": "Capacity"
        },
        "value": "200 Ah"
      },
      {
        "label": {
          "ar": "أقصى تيار مستمر",
          "en": "Max. continuous current"
        },
        "value": "150 A"
      },
      {
        "label": {
          "ar": "درجة الحماية",
          "en": "Ingress protection"
        },
        "value": "IP21"
      },
      {
        "label": {
          "ar": "التوسعة بالتوازي",
          "en": "Parallel expansion"
        },
        "value": "15 units max."
      }
    ],
    "note": {
      "ar": "6000 دورة عند عمق تفريغ 80% وحرارة 25°C وفق اختبار الشركة. يُراجع توافق العاكس قبل الربط.",
      "en": "6000 cycles at 80% depth of discharge and 25°C per manufacturer testing. Confirm inverter compatibility before connection."
    }
  },
  {
    id: "2cb4f5d3-d3e6-4836-8d11-14a96a1c0801",
    model: "MUST 51.2V · 300Ah",
    choice: "51.2V · 300Ah",
    series: "MUST (JOULE) · LiFePO₄",
    image: "https://ecbbhathvpxrgvfztzeu.supabase.co/storage/v1/object/public/product-images/products/fb2b09c1-c901-41b2-9df6-c6f2c049b489.jpeg",
    power: "300",
    unit: "Ah",
    summary: {
      ar: "بطارية ليثيوم MUST بجهد 51.2 فولت وسعة 300 أمبير ساعة، متوفرة ضمن كتالوج أفق البصرة.",
      en: "A MUST lithium battery rated at 51.2 volts and 300 ampere-hours, available in the UFUK AL-Basra catalog.",
    },
    specs: [
      { label: { ar: "تقنية البطارية", en: "Battery chemistry" }, value: "LiFePO₄" },
      { label: { ar: "الجهد الاسمي", en: "Nominal voltage" }, value: "51.2 V" },
      { label: { ar: "السعة", en: "Capacity" }, value: "300 Ah" },
    ],
    note: {
      ar: "لم تُرفق داتا شيت لهذا الموديل في المتجر. تأكد من التوافق مع العاكس ومتطلبات التركيب قبل الطلب.",
      en: "A datasheet is not attached to this catalog model. Confirm inverter compatibility and installation requirements before ordering.",
    },
  }
];
export const energyUps: EnergyProduct[] = [
  {
    "id": "9d3a6984-5cad-4c68-893d-3bfa0c68bb8e",
    "model": "BS-1KS",
    "choice": "Online · 1 kVA",
    "series": "Online double conversion",
    "image": "/images/energy/bluestorm-online.webp",
    "pdf": "/datasheets/energy/bluestorm-online.pdf",
    "power": "1",
    "unit": "kVA",
    "summary": {
      "ar": "UPS أونلاين بتحويل مزدوج وموجة جيبية نقية، مع بطاريات داخلية وشاشة LCD لمتابعة حالة الجهاز.",
      "en": "Online double-conversion UPS with pure sine wave output, internal batteries and an LCD status display."
    },
    "specs": [
      {
        "label": {
          "ar": "القدرة الظاهرية",
          "en": "Apparent power"
        },
        "value": "1000 VA"
      },
      {
        "label": {
          "ar": "القدرة الفعلية",
          "en": "Active power"
        },
        "value": "900 W"
      },
      {
        "label": {
          "ar": "التحويل إلى البطارية",
          "en": "AC to battery transfer"
        },
        "value": "0 ms"
      },
      {
        "label": {
          "ar": "معامل قدرة الخرج",
          "en": "Output power factor"
        },
        "value": "0.9"
      },
      {
        "label": {
          "ar": "البطاريات الداخلية",
          "en": "Internal batteries"
        },
        "value": "2 × 12 V / 9 Ah"
      },
      {
        "label": {
          "ar": "شكل الموجة",
          "en": "Waveform"
        },
        "value": "Pure sine wave"
      }
    ],
    "note": {
      "ar": "زمن التحويل 0ms من الكهرباء إلى البطارية؛ التحويل إلى Bypass عادةً 4ms. مدة التشغيل تعتمد على الحمل وحالة البطاريات.",
      "en": "0ms transfer from AC to battery; inverter-to-bypass transfer is typically 4ms. Runtime depends on load and battery condition."
    }
  },
  {
    "id": "9aed46b0-9604-4024-be62-fc0015686081",
    "model": "BS-2KS",
    "choice": "Online · 2 kVA",
    "series": "Online double conversion",
    "image": "/images/energy/bluestorm-online.webp",
    "pdf": "/datasheets/energy/bluestorm-online.pdf",
    "power": "2",
    "unit": "kVA",
    "summary": {
      "ar": "UPS أونلاين بتحويل مزدوج وموجة جيبية نقية، مع بطاريات داخلية وشاشة LCD لمتابعة حالة الجهاز.",
      "en": "Online double-conversion UPS with pure sine wave output, internal batteries and an LCD status display."
    },
    "specs": [
      {
        "label": {
          "ar": "القدرة الظاهرية",
          "en": "Apparent power"
        },
        "value": "2000 VA"
      },
      {
        "label": {
          "ar": "القدرة الفعلية",
          "en": "Active power"
        },
        "value": "1800 W"
      },
      {
        "label": {
          "ar": "التحويل إلى البطارية",
          "en": "AC to battery transfer"
        },
        "value": "0 ms"
      },
      {
        "label": {
          "ar": "معامل قدرة الخرج",
          "en": "Output power factor"
        },
        "value": "0.9"
      },
      {
        "label": {
          "ar": "البطاريات الداخلية",
          "en": "Internal batteries"
        },
        "value": "4 × 12 V / 9 Ah"
      },
      {
        "label": {
          "ar": "شكل الموجة",
          "en": "Waveform"
        },
        "value": "Pure sine wave"
      }
    ],
    "note": {
      "ar": "زمن التحويل 0ms من الكهرباء إلى البطارية؛ التحويل إلى Bypass عادةً 4ms. مدة التشغيل تعتمد على الحمل وحالة البطاريات.",
      "en": "0ms transfer from AC to battery; inverter-to-bypass transfer is typically 4ms. Runtime depends on load and battery condition."
    }
  },
  {
    "id": "6b1e16c1-f7d3-4e76-a438-e04cf61a49e6",
    "model": "BS-3KS",
    "choice": "Online · 3 kVA",
    "series": "Online double conversion",
    "image": "/images/energy/bluestorm-online.webp",
    "pdf": "/datasheets/energy/bluestorm-online.pdf",
    "power": "3",
    "unit": "kVA",
    "summary": {
      "ar": "UPS أونلاين بتحويل مزدوج وموجة جيبية نقية، مع بطاريات داخلية وشاشة LCD لمتابعة حالة الجهاز.",
      "en": "Online double-conversion UPS with pure sine wave output, internal batteries and an LCD status display."
    },
    "specs": [
      {
        "label": {
          "ar": "القدرة الظاهرية",
          "en": "Apparent power"
        },
        "value": "3000 VA"
      },
      {
        "label": {
          "ar": "القدرة الفعلية",
          "en": "Active power"
        },
        "value": "2700 W"
      },
      {
        "label": {
          "ar": "التحويل إلى البطارية",
          "en": "AC to battery transfer"
        },
        "value": "0 ms"
      },
      {
        "label": {
          "ar": "معامل قدرة الخرج",
          "en": "Output power factor"
        },
        "value": "0.9"
      },
      {
        "label": {
          "ar": "البطاريات الداخلية",
          "en": "Internal batteries"
        },
        "value": "6 × 12 V / 9 Ah"
      },
      {
        "label": {
          "ar": "شكل الموجة",
          "en": "Waveform"
        },
        "value": "Pure sine wave"
      }
    ],
    "note": {
      "ar": "زمن التحويل 0ms من الكهرباء إلى البطارية؛ التحويل إلى Bypass عادةً 4ms. مدة التشغيل تعتمد على الحمل وحالة البطاريات.",
      "en": "0ms transfer from AC to battery; inverter-to-bypass transfer is typically 4ms. Runtime depends on load and battery condition."
    }
  },
  {
    "id": "131bcced-6c40-4eed-9483-689a60df04c0",
    "model": "BS-3K-RM",
    "choice": "Rack · 3 kVA",
    "series": "Online rack / tower",
    "image": "/images/energy/bluestorm-rack.webp",
    "pdf": "/datasheets/energy/bluestorm-rack.pdf",
    "power": "3",
    "unit": "kVA",
    "summary": {
      "ar": "UPS أونلاين بتصميم قابل للتحويل بين الرف والبرج، وبطاريات قابلة للاستبدال الساخن وشاشة قابلة للدوران.",
      "en": "Online UPS with a convertible rack/tower design, hot-swappable batteries and a rotatable LCD."
    },
    "specs": [
      {
        "label": {
          "ar": "القدرة الظاهرية",
          "en": "Apparent power"
        },
        "value": "3000 VA"
      },
      {
        "label": {
          "ar": "القدرة الفعلية",
          "en": "Active power"
        },
        "value": "2700 W"
      },
      {
        "label": {
          "ar": "التحويل إلى البطارية",
          "en": "AC to battery transfer"
        },
        "value": "0 ms"
      },
      {
        "label": {
          "ar": "الارتفاع",
          "en": "Height"
        },
        "value": "86.5 mm"
      },
      {
        "label": {
          "ar": "البطاريات الداخلية",
          "en": "Internal batteries"
        },
        "value": "6 × 12 V / 9 Ah"
      },
      {
        "label": {
          "ar": "شكل الموجة",
          "en": "Waveform"
        },
        "value": "Pure sine wave"
      }
    ],
    "note": {
      "ar": "مدة التشغيل تعتمد على الحمل وحالة البطاريات. الصورة تعرض عائلة أجهزة الرف.",
      "en": "Runtime depends on load and battery condition. Image shows the rack product family."
    }
  },
  {
    "id": "d52568d8-0791-40d9-8eba-2d3624532e3f",
    "model": "BS-UPS-3000VA-LCD",
    "choice": "LCD · 3000 VA",
    "series": "Line Interactive",
    "image": "/images/energy/bluestorm-lcd.webp",
    "pdf": "/datasheets/energy/bluestorm-lcd.pdf",
    "power": "3000",
    "unit": "VA",
    "summary": {
      "ar": "UPS بتقنية Line Interactive وتنظيم جهد AVR وشاشة LCD، مع أربع بطاريات داخلية.",
      "en": "Line Interactive UPS with AVR voltage regulation, an LCD and four internal batteries."
    },
    "specs": [
      {
        "label": {
          "ar": "القدرة الظاهرية",
          "en": "Apparent power"
        },
        "value": "3000 VA"
      },
      {
        "label": {
          "ar": "مدى جهد الدخل",
          "en": "Input voltage range"
        },
        "value": "140–300 VAC"
      },
      {
        "label": {
          "ar": "زمن التحويل المعتاد",
          "en": "Typical transfer time"
        },
        "value": "4–8 ms"
      },
      {
        "label": {
          "ar": "أقصى زمن تحويل",
          "en": "Max. transfer time"
        },
        "value": "13 ms"
      },
      {
        "label": {
          "ar": "البطاريات الداخلية",
          "en": "Internal batteries"
        },
        "value": "4 × 12 V / 9 Ah"
      },
      {
        "label": {
          "ar": "شكل الموجة",
          "en": "Waveform"
        },
        "value": "Simulated sine wave"
      }
    ],
    "note": {
      "ar": "موجة جيبية محاكاة. تُراجع ملاءمتها للأجهزة المراد تشغيلها؛ مدة الإسناد تعتمد على الحمل.",
      "en": "Simulated sine wave output. Check suitability for the connected equipment; backup time depends on load."
    }
  }
];

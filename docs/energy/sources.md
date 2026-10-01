# MUST × BlueStorm energy campaign

Published selections checked against the active public catalog on 2026-10-01. Homepage replaces only the BST-CBB-EZ campaign; its product and existing landing route remain available. The inverter and lithium battery sections also list every matching public catalog product dynamically.

## Sources

All PDF files are unchanged copies of manufacturer documents supplied in the workspace at `datasheet/BLUESTORM POWERSOLUTIONS DATA SHEET/` (relative to the parent workspace). Individual product images are extracted from those documents, retaining transparency. The campaign image is a generated studio composition based on the EXP inverter, LP1600 battery and Online UPS reference images. Detail captions identify series images rather than claiming an exact photograph of each capacity.

| Website PDF | Source file | Models presented |
|---|---|---|
| must-eco.pdf | MUST ENERGY/SOLAR INVERTER/3.6KW-6KW-PV1800 ECO.pdf | PV18-6048 ECO |
| must-exp-4-6.pdf | MUST ENERGY/SOLAR INVERTER/4KW-6KW-PH1900 EXP.pdf | PH19-4024 EXP, PH19-6048 EXP |
| must-exp-8-10.pdf | MUST ENERGY/SOLAR INVERTER/8KW-10KW-PH1900 EXP.pdf | PH19-8048 EXP, PH19-10048 EXP |
| must-pro.pdf | MUST ENERGY/SOLAR INVERTER/6KW-PH1100 PRO.pdf | PH11-6048 PRO |
| must-lp1600.pdf | MUST ENERGY/LITHIUM BATTERIES/LP1600.pdf | LP16-24200, LP16-48200 |
| bluestorm-online.pdf | ONLINE UPS/BLUESTROM ONLINE UPS 1-3KS.pdf | BS-1KS, BS-2KS, BS-3KS |
| bluestorm-rack.pdf | ONLINE UPS/BLUESTROM ONLINE UPS 3K-RM.pdf | BS-3K-RM |
| bluestorm-lcd.pdf | LINE INTERACTIVE UPS/new models/BLUE STORM-UPS 3000 VA LCD.pdf | BS-UPS-3000VA-LCD |

## Specification qualifications

- ECO 6kW: 6000W rated output, **5500W battery-mode output**. Do not conflate these.
- PRO IP66 applies to the PRO model, not the entire inverter range. Derating above 45°C is stated.
- EXP parallel capability depends on the parallel model; large EXP maximum PV voltage in parallel is 450V. Wi-Fi optional on the 4/6kW series.
- LP1600 energy is **kWh**, not kW: 5.12kWh / 10.24kWh at 200Ah. 6000 cycles is specified at 80% DOD and 25°C. Parallel capacity is up to 15 modules for this series; no blanket compatibility promise.
- The MUST (JOULE) 51.2V 300Ah LiFePO4 battery is listed in the public catalog under ID `2cb4f5d3-d3e6-4836-8d11-14a96a1c0801`. Its catalog image and confirmed voltage/capacity/chemistry are shown. No datasheet is attached, so LP1600 specifications must not be applied to it.
- Online KS and RM output factor 0.9: 1/2/3kVA = 900/1800/2700W. 0ms refers only to AC-to-battery transfer; bypass transfer is typically 4ms.
- Line Interactive LCD is 3000VA; no unsupported wattage was inferred. Simulated sine wave, 4–8ms typical / 13ms max. No fixed runtime claimed.
- Only public catalog products are shown. The featured 300Ah battery has no datasheet link. Prices and stock for featured models stay on their product pages; the catalog cards show current public pricing.

Model-to-catalog IDs are in `src/lib/energy.ts`. Model selection updates image, specs, notes, available PDF, product link and quote link together. Public catalog cards are loaded from `products_public`, so future matching products appear without editing this landing page.

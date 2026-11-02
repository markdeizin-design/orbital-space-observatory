# Explorer photographs and alpha cutouts

All three photographs show real NASA flight hardware. No renders, generated spacecraft, generative fill, upscaling, recoloring, relighting, or replacement geometry were used. The masters change the alpha channel only. Every surviving RGB pixel was compared exactly with its decoded NASA original after a lossless WebP roundtrip.

## Delivery and resolution

`*-cutout.webp` is the native-resolution, lossless alpha master. `*-preview.webp` is a separate responsive display derivative, at most 960 pixels on its long side, encoded at quality 92. Transparent outer padding is trimmed to the alpha bounds plus approximately 2% margin; no hardware pixels were rescaled in the masters. `metadata.json` records exact source dimensions, crop bounds, master dimensions, display dimensions, and file sizes.

Source canvas dimensions are not the same as spacecraft detail resolution. Hubble's 7000-pixel source contains large black margins; its cutout is approximately 3536 × 2871. Fermi's 3008-pixel source contains a cleanroom around the spacecraft; its cutout is 1394 × 1676. Webb's cutout is 4111 × 5043 and preserves over 4K of native pictured hardware detail. Do not label every cutout 4K.

The unchanged source downloads are stored outside the public website in `work/photo-candidates/originals/`; the selected new Webb original is `work/photo-candidates/webb-stowed-2.jpg`.

## Hubble

- Files: `hubble-cutout.webp`, `hubble-preview.webp`.
- Original: 7000 × 3520, NASA; STS-125 crew, May 19, 2009.
- [Official image record: Bidding Hubble Farewell After Servicing Mission 4](https://science.nasa.gov/asset/hubble/bidding-hubble-farewell-after-servicing-mission-4-2009/).
- [Exact original PNG](https://assets.science.nasa.gov/content/dam/science/missions/hubble/servicing-missions/sm4/STScI-01EVVGK15N8BAA1DNZG29HV097.png).
- Suggested caption: **Hubble, photographed by the STS-125 crew after Servicing Mission 4, 2009. NASA.**
- Matte: measured black-space edge, manually constrained solid shadow regions, and low-threshold detail masks around dark solar arrays and dishes. The aperture door, arrays, antenna dishes and slender antenna masts are retained. No artificial highlights or decontamination changed the photographic RGB values.

## James Webb

- Files: `webb-cutout.webp`, `webb-preview.webp`.
- Original: 8258 × 6200, NASA/Chris Gunn, September 2020; article published October 6, 2020.
- [Official article: NASA's James Webb Space Telescope Completes Environmental Testing](https://www.nasa.gov/solar-system/nasas-james-webb-space-telescope-completes-environmental-testing/).
- [Exact original JPEG](https://www.nasa.gov/wp-content/uploads/2020/12/fullobervatoryliftsmgunnsept2020.jpg).
- Suggested caption: **Webb in its fully stowed ground-test configuration, 2020. NASA/Chris Gunn.**
- The real, fully assembled flight observatory is shown folded for environmental testing, not deployed in space. All pictured spacecraft hardware fits inside the source frame. The cleanroom, crane frame, hoist lines, ground clamps and transport supports have been excluded with a hand-traced alpha mask. No hidden parts were reconstructed. Original reflections in the gold mirror, including reflected cleanroom lighting, remain photographic pixels.
- The previously considered `finalsunshielddeploy6gunn.jpg` was rejected as an Explorer cutout because the source frame already crops the sunshield. It remains suitable only as a correctly captioned full photographic document, not a complete isolated spacecraft.

## Fermi (GLAST before launch)

- Files: `fermi-cutout.webp`, `fermi-preview.webp`.
- Original: 2000 × 3008, NASA/Jim Grossmann, 2008; NASA identifier `KSC-08pd1359`.
- [NASA image record](https://images.nasa.gov/details/KSC-08pd1359).
- [Exact original JPEG](https://images-assets.nasa.gov/image/KSC-08pd1359/KSC-08pd1359~orig.jpg).
- Suggested caption: **Fermi / GLAST during ground processing, with solar arrays folded, 2008. NASA/Jim Grossmann.**
- This is a real photograph in the Astrotech processing facility, not a deployed-spacecraft render. The surrounding personnel, floor, circular processing stand, outer suspension lines and external beam protrusions have been excluded by a hand-traced alpha mask. An upper handling beam and hook that actually occlude flight hardware remain visible within the photographed body: removing them would require inventing the hidden hardware pixels. Do not imply this is an unoccluded in-orbit portrait.
- The user approved the honest approximately 3K original alternative. Official originals `KSC-08pd0644`, `KSC-08pd0653`, `KSC-08pd1033` and `KSC-08pd1358` were also checked and are about 3000 pixels on the long side. No genuine qualifying 4K photograph of the full deployed spacecraft was located. No enlargement is presented as native detail.

## Usage and inspection

NASA factual educational imagery can generally be reused with acknowledgement and without implied endorsement. Retain the photographer and mission credits and identify alpha masking and cropping. This independent exhibition is not affiliated with or endorsed by NASA or its partners. [NASA media usage guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/).

All masters decode successfully. Alpha edges were visually inspected on dark and light backgrounds; native surviving RGB values were verified byte for byte. Edge antialiasing changes alpha only. Previews are intentionally reduced display derivatives. Research and processing date: November 2, 2026.


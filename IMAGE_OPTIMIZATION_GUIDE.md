# Image Optimization Guide

This guide explains how to convert and optimize your images to WebP format for better PageSpeed scores.

## Required Images to Convert

### 1. Logo Image (CRITICAL - Highest Priority)
**Current:** `viber_image_2026-04-22_11-03-51-142.jpg` (218.4 KiB, 1024x1536px)
**Target:** Resize to 120x180px (2x for retina), then convert to WebP

**Steps:**
1. Open image in image editor (Photoshop, GIMP, or online tool)
2. Resize to 120x180 pixels (maintains 2:3 aspect ratio for retina displays)
3. Export/Save as WebP format with quality 80-85%
4. Save as: `viber_image_2026-04-22_11-03-51-142.webp`
5. Keep original JPG as fallback

**Expected Result:** ~5-10 KiB (95% size reduction)

### 2. Hero Background Image
**Current:** `Car Images/download (2).jpg`
**Target:** Convert to WebP, optimize for different screen sizes

**Steps:**
1. Create WebP version at full size: `hero-banner.webp`
2. Also save standard size: `hero-banner.jpg` (1920x1080 recommended)
3. Compress both with quality 80-85%

**Recommended sizes:**
- Desktop: 1920x1080
- Tablet: 1024x768
- Mobile: 768x576

### 3. Car Listing Images (6 images)
**Current:** `images/car-1.jpg` through `images/car-6.jpg`
**Target:** Convert all to WebP format

**Steps for each:**
1. Open image
2. Resize if larger than 880x600 (2x for 440x300 display size)
3. Export as WebP with quality 80%
4. Save as: `images/car-1.webp`, `images/car-2.webp`, etc.
5. Keep original JPGs as fallback

## Tools for Conversion

### Online Tools (Easiest)
1. **Squoosh** (https://squoosh.app/)
   - Free, open-source by Google
   - Drag and drop images
   - Adjust quality settings
   - Download WebP version

2. **CloudConvert** (https://cloudconvert.com/jpg-to-webp)
   - Batch conversion support
   - Free for basic use

### Command Line (For batch processing)
Using `cwebp` (part of libwebp package):

```bash
# Install cwebp
# macOS: brew install webp
# Ubuntu: sudo apt-get install webp
# Windows: Download from https://developers.google.com/speed/webp/download

# Convert single image
cwebp -q 80 input.jpg -o output.webp

# Batch convert all JPG images in a folder
for file in *.jpg; do
  cwebp -q 80 "$file" -o "${file%.jpg}.webp"
done
```

### Image Editors
1. **Photoshop** (2021+)
   - File → Export → Save for Web
   - Select WebP format
   - Adjust quality slider

2. **GIMP** (Free)
   - Install WebP plugin
   - File → Export As
   - Select .webp extension

## Recommended Quality Settings

| Image Type | WebP Quality | Expected Size Reduction |
|------------|--------------|------------------------|
| Logo | 85% | 90-95% |
| Hero Background | 80% | 60-75% |
| Car Photos | 80-85% | 70-80% |

## After Conversion Checklist

- [ ] Convert logo to 120x180px and save as WebP
- [ ] Create `hero-banner.webp` from hero background
- [ ] Convert all 6 car images to WebP
- [ ] Place WebP files in same directory as originals
- [ ] Keep original JPG files as fallbacks (already configured in HTML)
- [ ] Test website loads WebP in modern browsers
- [ ] Verify fallback JPG works in older browsers

## Verification

After converting images:

1. **Check file sizes:**
   ```bash
   ls -lh viber_image*.{jpg,webp}
   ls -lh hero-banner.{jpg,webp}
   ls -lh images/*.{jpg,webp}
   ```

2. **Test in browsers:**
   - Chrome/Edge: Should load .webp
   - Safari 14+: Should load .webp
   - Older browsers: Should load .jpg fallback

3. **Run PageSpeed Insights:**
   - Visit https://pagespeed.web.dev/
   - Enter your site URL
   - Verify "Properly size images" passes
   - Check "Serve images in next-gen formats" passes

## Expected Results

After converting all images:
- **Before:** 218.4 KiB (logo alone)
- **After:** ~10 KiB (logo) + optimized backgrounds
- **Overall savings:** 200+ KiB reduction

This should significantly improve:
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)
- Overall Performance Score

## Automation Script (Optional)

For future updates, save this script as `convert-images.sh`:

```bash
#!/bin/bash

# Convert logo
cwebp -q 85 -resize 120 180 viber_image_2026-04-22_11-03-51-142.jpg -o viber_image_2026-04-22_11-03-51-142.webp

# Convert hero banner
cwebp -q 80 -resize 1920 1080 "Car Images/download (2).jpg" -o hero-banner.webp

# Convert car images
for i in {1..6}; do
  cwebp -q 80 -resize 880 600 "images/car-$i.jpg" -o "images/car-$i.webp"
done

echo "Image conversion complete!"
```

Make executable: `chmod +x convert-images.sh`
Run: `./convert-images.sh`

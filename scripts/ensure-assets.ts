import { existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import type { SoundwaveScript } from "../src/lib/types";

/**
 * Scans a script for all referenced image paths and creates placeholder
 * images for any that don't exist in public/.
 */
export function ensureAssets(script: SoundwaveScript): string[] {
  const publicDir = path.resolve("public");
  const missing: string[] = [];

  const imagePaths = new Set<string>();

  for (const scene of script.scenes) {
    if (scene.type === "title") {
      if (scene.props.logo) imagePaths.add(scene.props.logo);
      if (scene.props.background && !scene.props.background.startsWith("#")) {
        imagePaths.add(scene.props.background);
      }
    } else if (scene.type === "showcase") {
      for (const img of scene.props.images) {
        imagePaths.add(img);
      }
    } else if (scene.type === "callToAction") {
      if (scene.props.logo) imagePaths.add(scene.props.logo);
    }
  }

  for (const imgPath of imagePaths) {
    const fullPath = path.join(publicDir, imgPath);
    if (!existsSync(fullPath)) {
      missing.push(imgPath);
      // Create placeholder
      const dir = path.dirname(fullPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

      try {
        // Use Python PIL to create a themed placeholder
        const { primary, background } = script.meta.theme;
        const label = path.basename(imgPath, path.extname(imgPath)).replace(/[-_]/g, " ");
        execSync(
          `python3 -c "
from PIL import Image, ImageDraw
img = Image.new('RGB', (1920, 1080), '${background}')
draw = ImageDraw.Draw(img)
draw.rectangle([60, 60, 1860, 1020], outline='${primary}', width=3)
draw.text((800, 510), '${label}', fill='${primary}')
img.save('${fullPath}')
"`,
          { stdio: "pipe" },
        );
      } catch {
        // Fallback: create a tiny valid PNG (1x1 pixel)
        const PNG_1x1 = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64",
        );
        require("fs").writeFileSync(fullPath, PNG_1x1);
      }
      console.log(`  Created placeholder: ${imgPath}`);
    }
  }

  return missing;
}

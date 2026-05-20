const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/reader/profile/page.tsx', 'utf8');

code = code.replace(/\/\/ ── Avatar Card ─+[\s\S]*?^}/m, "import { AvatarCard, AccordionPersonalInfo, SecurityCard } from '@/components/profile/SharedProfile'");
code = code.replace(/\/\/ ── AccordionPersonalInfo ─+[\s\S]*?\/\/ ── TallLibraryCard/m, "// ── TallLibraryCard");

fs.writeFileSync('page_new.tsx', code);

#!/bin/bash
# Batch replace all purple instances with lime/brand colors

cd "$(dirname "$0")"

# Purple hex codes to lime
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i 's/#8b5cf6/rgba(196, 248, 42, 0.65)/g' "$file"
  sed -i 's/#a855f7/#D4FF5E/g' "$file"
  sed -i 's/#7c3aed/#A8D622/g' "$file"
  sed -i 's/#c084fc/#E0FF8A/g' "$file"

  # Purple Tailwind classes
  sed -i 's/bg-purple-\([0-9]\+\)\/\([0-9]\+\)/bg-[var(--orb-purple)]\/\2/g' "$file"
  sed -i 's/bg-purple-\([0-9]\+\)/bg-brand-accent/g' "$file"
  sed -i 's/text-purple-\([0-9]\+\)\/\([0-9]\+\)/text-brand-accent\/\2/g' "$file"
  sed -i 's/text-purple-\([0-9]\+\)/text-brand-accent/g' "$file"
  sed -i 's/border-purple-\([0-9]\+\)\/\([0-9]\+\)/border-[var(--orb-purple)]\/\2/g' "$file"
  sed -i 's/border-purple-\([0-9]\+\)/border-brand-accent/g' "$file"
  sed -i 's/from-purple-\([0-9]\+\)/from-brand-accent/g' "$file"
  sed -i 's/to-purple-\([0-9]\+\)/to-[#A8D622]/g' "$file"
  sed -i 's/hover:bg-purple-\([0-9]\+\)\/\([0-9]\+\)/hover:bg-[var(--orb-purple)]\/\2/g' "$file"
  sed -i 's/hover:bg-purple-\([0-9]\+\)/hover:bg-brand-accent/g' "$file"
  sed -i 's/hover:text-purple-\([0-9]\+\)/hover:text-brand-accent/g' "$file"
  sed -i 's/hover:border-purple-\([0-9]\+\)/hover:border-brand-accent/g' "$file"
  sed -i 's/focus:border-purple-\([0-9]\+\)/focus:border-brand-accent/g' "$file"
  sed -i 's/focus:ring-purple-\([0-9]\+\)\/\([0-9]\+\)/focus:ring-brand-accent\/\2/g' "$file"
  sed -i 's/focus:ring-purple-\([0-9]\+\)/focus:ring-brand-accent/g' "$file"
  sed -i 's/ring-purple-\([0-9]\+\)\/\([0-9]\+\)/ring-brand-accent\/\2/g' "$file"
  sed -i 's/ring-purple-\([0-9]\+\)/ring-brand-accent/g' "$file"
  sed -i 's/shadow-purple-\([0-9]\+\)\/\([0-9]\+\)/shadow-[var(--orb-glow)]/g' "$file"
  sed -i 's/shadow-purple-\([0-9]\+\)/shadow-[var(--orb-glow)]/g' "$file"

  # Pink gradients (companion to purple)
  sed -i 's/to-pink-500/to-[#A8D622]/g' "$file"
  sed -i 's/to-pink-600/to-[#A8D622]/g' "$file"

  # Slate background (0f172a) to black
  sed -i 's/#0f172a/#050505/g' "$file"
  sed -i 's/bg-slate-900/bg-black/g' "$file"

  echo "Processed: $file"
done

echo "Purple eradication complete!"

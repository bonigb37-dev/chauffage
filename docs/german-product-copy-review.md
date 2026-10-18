# Contrôle des textes produits — 18 octobre 2026

Les 71 produits ont été vérifiés après application des traductions allemandes : noms, descriptions, conditionnements, types, sections et badges. Les titres et descriptions des quatre catégories ont aussi été contrôlés.

Quatre traductions de conditionnement recopiaient le français au lieu de le traduire. Elles sont corrigées dans le dictionnaire et dans le catalogue importé :

- `Palette · 96 paquets · 960 kg` → `Palette · 96 Pakete · 960 kg`
- `Palette · 66 sacs · 990 kg` → `Palette · 66 Säcke · 990 kg`
- `Palette · 65 sacs · 975 kg` → `Palette · 65 Säcke · 975 kg`
- `Palette · 48 paquets · 480 kg` → `Palette · 48 Pakete · 480 kg`

`Palette` est aussi le mot allemand au singulier ; son pluriel est `Paletten`.

La lecture publique de Supabase a permis de contrôler le catalogue fusionné avec les 57 lignes de personnalisation : 71 produits, aucun résidu français détecté dans les champs contrôlés. La base n’a pas été modifiée.

Le script `node scripts/verify-german-copy.cjs --report` vérifie tous les produits et écrit le détail dans `docs/german-product-copy-checks.json`. Il couvre également les quatre anciens libellés français, pour les données historiques de l’administration.

Le contrôle du flux Merchant passe pour 70 produits. Giant Flames (60) reste exclu faute de photo, conformément au retrait demandé. Ces contrôles ne constituent pas une confirmation de publication.

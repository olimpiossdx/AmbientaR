/**
 * Migra formulários simples para useStorageFileUpload (pasta fixa).
 * Uso: node scripts/migrate-forms-storage-upload.mjs
 */
import fs from "fs";

const forms = [
  {
    file: "e:/A/src/app/(app)/licenses/license-form.tsx",
    folder: "licenses",
    oldConst: "const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB",
    zodPattern: /files\?\.\[0\]\?\.size <= MAX_FILE_SIZE/g,
  },
  {
    file: "e:/A/src/app/(app)/intervencoes/intervencao-form.tsx",
    folder: "intervencoes",
    oldConst: "const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB",
    zodPattern: /files\?\.\[0\]\?\.size <= MAX_FILE_SIZE/g,
  },
  {
    file: "e:/A/src/app/(app)/outorgas/outorga-form.tsx",
    folder: "outorgas",
    oldConst: "const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB",
    zodPattern: null,
  },
  {
    file: "e:/A/src/app/(app)/usos-insignificantes/uso-insignificante-form.tsx",
    folder: "usos-insignificantes",
    oldConst: "const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB",
    zodPattern: null,
  },
  {
    file: "e:/A/src/app/(app)/proposals/proposal-form.tsx",
    folder: "proposals",
    oldConst: "const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB",
    zodPattern: /files\?\.\[0\]\?\.size <= MAX_FILE_SIZE/g,
  },
  {
    file: "e:/A/src/app/(app)/fauna/fauna-upload-form.tsx",
    folder: "fauna",
    oldConst: "const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB",
    zodPattern: null,
  },
];

const importRemove =
  /import\s*\{\s*uploadFileToStorage,\s*sanitizeStorageFileName,\s*\}\s*from\s*['"]@\/lib\/storage-upload['"];\s*\n/;
const importAdd = `import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import { UPLOAD_RAW_FILE_SAFETY_MAX } from "@/lib/upload-limits";
`;

for (const { file, folder, oldConst, zodPattern } of forms) {
  if (!fs.existsSync(file)) {
    console.warn("skip missing", file);
    continue;
  }
  let s = fs.readFileSync(file, "utf8");
  if (s.includes("useStorageFileUpload")) {
    console.log("already migrated", file);
    continue;
  }
  s = s.replace(importRemove, importAdd);
  s = s.replace(oldConst + "\n", "");
  if (zodPattern) {
    s = s.replace(
      zodPattern,
      "files?.[0]?.size <= UPLOAD_RAW_FILE_SAFETY_MAX",
    );
    s = s.replace(
      /`O tamanho máximo do arquivo é \$\{MAX_FILE_SIZE \/ 1024 \/ 1024\}MB\.`/g,
      '"Arquivo excede o limite de processamento no navegador."',
    );
  }
  const hookBlock = `  const { uploadFile, dialogProps, limitLabel } = useStorageFileUpload({
    storageFolder: "${folder}",
  });
`;
  if (!s.includes("useStorageFileUpload({")) {
    s = s.replace(
      /const \{ toast \} = useToast\(\);\s*\n\s*const \{ firestore/,
      (m) => m.replace("const { firestore", hookBlock + "  const { firestore"),
    );
  }
  s = s.replace(
    /if \(file\.size > MAX_FILE_SIZE\) \{[\s\S]*?return;\s*\}\s*\n\s*/g,
    "",
  );
  s = s.replace(
    /const safe\w* = sanitizeStorageFileName\(file\.name\);\s*\n\s*const downloadU\w+ = await uploadFileToStorage\(\s*file,\s*`[^`]+`,\s*\);\s*/g,
    "const downloadURL = await uploadFile(file);\n      if (!downloadURL) return;\n      ",
  );
  s = s.replace(
    /const downloadUrl = await uploadFileToStorage\(\s*file,\s*`[^`]+`,\s*\);\s*/g,
    "const downloadUrl = await uploadFile(file);\n      if (!downloadUrl) return;\n      ",
  );
  if (!s.includes("UploadPreparationDialog")) {
    s = s.replace(/(\s*<\/Form>\s*\n\s*\);)/, "\n      <UploadPreparationDialog {...dialogProps} />$1");
    s = s.replace(/(\s*<\/form>\s*\n\s*<\/Form>)/, "\n      <UploadPreparationDialog {...dialogProps} />$1");
  }
  fs.writeFileSync(file, s);
  console.log("migrated", file);
}

import path from "node:path";

const normalize = (value) => value.replaceAll("\\", "/");

export const architectureRule = {
  meta: { type: "problem", schema: [], messages: { boundary: "{{reason}}" } },
  create(context) {
    const filename = normalize(context.filename);
    const marker = filename.lastIndexOf("/src/");
    if (marker < 0) return {};
    const file = filename.slice(marker + 5);
    const currentFeature = file.match(/^features\/([^/]+)\//)?.[1];
    const client = context.sourceCode.ast.body.some((node) => node.directive === "use client");
    function report(node, reason) { context.report({ node, messageId: "boundary", data: { reason } }); }
    function check(node) {
      const source = node.source?.value;
      if (typeof source !== "string") return;
      let target;
      if (source.startsWith("@/")) target = source.slice(2);
      else if (source.startsWith(".")) target = path.posix.normalize(path.posix.join(path.posix.dirname(file), source));
      else return;
      if (file.startsWith("features/") && target.startsWith("app/")) report(node, "Feature không được import app.");
      if ((file.startsWith("lib/") || file.startsWith("components/ui/")) && /^(features|app)\//.test(target)) report(node, "Lib và UI dùng chung không được phụ thuộc feature/app.");
      const importedFeature = target.match(/^features\/([^/]+)(.*)$/);
      if (importedFeature && importedFeature[1] !== currentFeature && !["", "/index", "/index.ts"].includes(importedFeature[2])) report(node, "Import feature khác qua public index.");
      const serverFacade = file === "lib/auth/session.ts";
      const serverPage = file.startsWith("app/") && !client;
      if (/^(server\/|mocks\/|lib\/env(?:\.|$))/.test(target) && !file.startsWith("server/") && !serverPage && !serverFacade) report(node, "Server/env/fixture chỉ được truy cập bởi server, server page và session facade.");
      if (client && /^(server\/|lib\/auth\/(session|require-role))/.test(target)) report(node, "Client Component không được import module session/server.");
    }
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression(node) { check({ ...node, source: node.source }); },
      CallExpression(node) {
        if (/^(features|components|providers)\//.test(file) && node.callee.type === "Identifier" && node.callee.name === "fetch") report(node, "Gọi API qua service và lib/api/client.");
      },
    };
  },
};

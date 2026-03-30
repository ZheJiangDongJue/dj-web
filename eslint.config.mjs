import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      ".原型/**",
      // 忽略自动生成的大型类型镜像文件，避免无意义的 lint 噪音
      "src/types/erp-db.generated.ts",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;

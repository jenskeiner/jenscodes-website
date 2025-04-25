import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import babel from "@rollup/plugin-babel"
import eslint from "@rollup/plugin-eslint"
import terser from "@rollup/plugin-terser"
import postcss from "rollup-plugin-postcss"
import replace from "@rollup/plugin-replace"
import image from "@rollup/plugin-image"
import typescript from "@rollup/plugin-typescript"
import path from "path"
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common plugin configurations
const getCommonPlugins = (isProd, sourcemap = false, outputDir) => [
  nodeResolve({
    preferBuiltins: true,
    extensions: ['.js', '.ts', '.tsx'],
  }),
  commonjs(),
  replace({
    preventAssignment: true,
    "process.env.NODE_ENV": JSON.stringify(isProd ? "production" : "development"),
  }),
  typescript({
    tsconfig: './tsconfig.json',
    sourceMap: sourcemap !== false,
    inlineSources: sourcemap !== false,
    compilerOptions: {
      outDir: outputDir || 'static/assets',
    }
  }),
  eslint(),
  babel({
    exclude: "node_modules/**",
    configFile: path.resolve(__dirname, "babel.config.json"),
    babelHelpers: "bundled",
    extensions: ['.js', '.ts', '.tsx'],
  }),
];

const dev = async () => {
  const isProd = false;
  const sourcemap = 'inline'; // false
  
  // Main application bundle
  const appBundle = {
    input: "src/app.ts",
    output: { 
      file: "assets/assets/app.js", 
      format: "esm", 
      sourcemap 
    },
    context: "window",
    plugins: [
      ...getCommonPlugins(isProd, sourcemap, 'assets/assets'),
      postcss({
        config: {
          path: "./postcss.config.js",
        },
        extensions: [".css"],
        extract: true,
        minimize: false,
      }),
      image({
        dom: true,
      }),
    ],
  };

  // Home page  bundle
  const appHomeBundle = {
    input: "src/app_home.ts",
    output: { 
      file: "assets/assets/app_home.js", 
      format: "esm", 
      sourcemap 
      },
      context: "window",
      plugins: [
        ...getCommonPlugins(isProd, sourcemap, 'assets/assets'),
        postcss({
          config: {
            path: "./postcss.config.js",
          },
          extensions: [".css"],
          extract: true,
          minimize: false,
        }),
        image({
          dom: true,
        }),
      ],
    };
  
  // Search worker bundle
  const workerBundle = {
    input: "src/ts/integrations/search/worker/main/index.ts",
    output: { 
      file: "assets/assets/search-worker.js", 
      format: "esm", 
      sourcemap 
    },
    context: "self",
    plugins: getCommonPlugins(isProd, sourcemap, 'assets/assets'),
  };
  
  return [appBundle, appHomeBundle,workerBundle];
};

const prod = async () => {
  const isProd = true;
  const sourcemap = false;
  
  // Main application bundle
  const appBundle = {
    input: "src/app.ts",
    output: { 
      file: "assets/assets/app.js", 
      format: "esm", 
      sourcemap 
    },
    context: "window",
    plugins: [
      ...getCommonPlugins(isProd, sourcemap, 'assets/assets'),
      postcss({
        config: {
          path: "./postcss.config.js",
        },
        extensions: [".css"],
        extract: true,
        minimize: true,
      }),
      terser(),
      image({
        dom: true,
      }),
    ],
  };
  
  // Home page bundle
  const appHomeBundle = {
    input: "src/app_home.ts",
    output: { 
      file: "assets/assets/app_home.js", 
      format: "esm", 
      sourcemap 
    },
    context: "window",
    plugins: [
      ...getCommonPlugins(isProd, sourcemap, 'assets/assets'),
      postcss({
        config: {
          path: "./postcss.config.js",
        },
        extensions: [".css"],
        extract: true,
        minimize: true,
      }),
      terser(),
      image({
        dom: true,
      }),
    ],
  };

  // Search worker bundle
  const workerBundle = {
    input: "src/ts/integrations/search/worker/main/index.ts",
    output: { 
      file: "assets/assets/search-worker.js", 
      format: "esm", 
      sourcemap 
    },
    context: "self",
    plugins: [
      ...getCommonPlugins(isProd, sourcemap, 'assets/assets'),
      terser(),
    ],
  };
  
  return [appBundle, appHomeBundle,workerBundle];
};

// Determine which config to use based on NODE_ENV
const conf = () => {
  try {
    return import.meta.env?.MODE === "production" ? prod : dev;
  } catch {
    return dev; // Default to development if environment detection fails
  }
}

export default conf()

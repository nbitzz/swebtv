import svelte from 'rollup-plugin-svelte'
import resolve from "@rollup/plugin-node-resolve"
import autoPreprocess from "svelte-preprocess";
import typescript from '@rollup/plugin-typescript';

export default [
    {
        input: "src/ts/index.ts",
        output: {
            file: 'pages/script/main.js',
            format: 'esm',
            sourcemap:true
        },
        plugins: [
            svelte({
                preprocess: autoPreprocess(),
            }),
            typescript({sourceMap:false}),
            resolve()
        ]
    }
]
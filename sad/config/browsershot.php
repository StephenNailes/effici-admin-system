<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Node Binary Path
    |--------------------------------------------------------------------------
    |
    | Path to the Node.js binary. Defaults to 'node' which will use the
    | system PATH. You can specify a full path if needed.
    |
    */
    'node_binary' => env('BROWSERSHOT_NODE_BINARY', 'node'),

    /*
    |--------------------------------------------------------------------------
    | NPM Binary Path
    |--------------------------------------------------------------------------
    |
    | Path to the NPM binary. Defaults to 'npm' which will use the
    | system PATH. You can specify a full path if needed.
    |
    */
    'npm_binary' => env('BROWSERSHOT_NPM_BINARY', 'npm'),

    /*
    |--------------------------------------------------------------------------
    | Chrome/Chromium Binary Path
    |--------------------------------------------------------------------------
    |
    | Path to Chrome/Chromium binary. Leave null to auto-detect.
    |
    */
    'chrome_path' => env('BROWSERSHOT_CHROME_PATH', null),
];

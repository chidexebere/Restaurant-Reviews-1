module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",

    "globals": {
        "DBHelper": false,
        "google": false
    },
    "parserOptions": {
        "ecmaVersion": 2015,
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "warn",
            "tab",
            { "SwitchCase": 1 }
        ],
        "linebreak-style": [
            "warn",
            "windows"
        ],
        "quotes": [
            "warn",
            "single"
        ],
        "semi": [
            "warn",
            "always"
        ],
        "no-console": "off",
        "no-unused-vars": "warn",
        "no-undef": "warn",
        "no-useless-escape": "warn",
        "no-fallthrough": "off",
        "no-case-declarations": "off"
    }
};



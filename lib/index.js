"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeType = exports.transform = exports._transform = exports.parse = void 0;
const parser_1 = require("./parser");
Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return parser_1.parse; } });
const transform_1 = require("./transform");
Object.defineProperty(exports, "_transform", { enumerable: true, get: function () { return transform_1.transform; } });
Object.defineProperty(exports, "MergeType", { enumerable: true, get: function () { return transform_1.MergeType; } });
const transform = (template) => {
    return transform_1.transform(parser_1.parse(template));
};
exports.transform = transform;

import express from "express";
import { createRequestHandler } from "@react-router/express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import module build của server
import * as build from "./build/server/index.js";

const app = express();
const port = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

// 1. Phục vụ các file tĩnh (js, css, images...) từ thư mục `build/client` trước tiên.
// Bất kỳ request nào khớp với một file trong này sẽ được trả về ngay lập tức.
app.use(express.static(join(__dirname, "build/client")));

// 2. Dùng handler của React Router làm middleware cuối cùng.
// Nó sẽ xử lý tất cả các request KHÔNG phải là file tĩnh đã được xử lý ở trên.
app.use(createRequestHandler({ build }));

app.listen(port, '0.0.0.0', () => {
  console.log(`Express server listening on http://0.0.0.0:${port}`);
});
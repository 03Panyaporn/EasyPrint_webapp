import { config } from "dotenv";
import { join } from "path";

config({ path: join(import.meta.dir, "../../../.env") });
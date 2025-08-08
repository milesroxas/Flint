// This file now re-exports from entities/style/model to preserve imports during migration
export {
  createStyleService,
  type StyleService,
  type StyleInfo,
  type StyleWithElement,
  type ElementStyleInfo,
} from "@/entities/style/model/style.service";
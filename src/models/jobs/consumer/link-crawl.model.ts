import Joi from "joi";

export const LinkCrawlModel = Joi.object({
  href: Joi.string().uri().required(),
  chapterNumber: Joi.string().required(),
});

import { StatusOnlyMutationResponseModel } from "@modules/crawl-engine/common/types/status-only-mutation-response.model";

export abstract class ResponseUtils {
    public static successWithStatusOnly() {
        return new StatusOnlyMutationResponseModel(true, "200", "Success");
    }

    public static failedWithStatusOnly() {
        return new StatusOnlyMutationResponseModel(false, "500", "Failed");
    }
}
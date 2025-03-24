export abstract class APIResponse {

  public static successWithNoResponse(res: Promise<any>) {
    res
      .then(() => {})
      .catch((err) => {
        throw err;
      });
  }
}
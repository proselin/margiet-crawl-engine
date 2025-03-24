/**
 * Cập nhật thông tin cho comic-fe
 */
export interface IUpdateComicJobData {
  /**
   *
   * @description là id của comic-fe có tồn tại trong hệ thống
   */
  comicId: number;
  /**
   * @description NewUrl chỉ có giá trị khi muốn thay thế originUrl trong comicSchema
   * @default null
   * @see Comic
   */
  newUrl: string | null;
}

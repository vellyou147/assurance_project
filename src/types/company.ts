export interface Company {
  /** OpenDART 고유 법인코드 */
  corpCode: string;
  /** 공시상 회사명 */
  corpName: string;
  /** 상장 종목코드. 비상장 법인은 null */
  stockCode: string | null;
  isListed: boolean;
  /** 기존 목업 결과와의 호환을 위한 내부 식별자 */
  id: string;
  name: string;
  code: string;
}

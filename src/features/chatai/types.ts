
export type RequestDebugOption = {
    /** 응답 결과에서 API키 등 민감정보를 마스킹하지 않음 */
    disableMasking? : boolean;
    
    /** stream 활성화 시, raw 데이터 가져오기 */
    rawStream? : boolean;
}
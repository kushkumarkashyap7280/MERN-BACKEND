// day_007 ---------------------------------------------------------
class apiRes{
    constructor(
        statusCode,
        data ,
        message = "success",
        success = true
    ){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message,
        this.success = success
    }
}

export default apiRes;
//--------------------------------------------------------------
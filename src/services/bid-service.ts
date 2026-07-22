import { api } from "./axios-instance/axios-instance";

export const BidService = {
    sendWorkerBetterrPrice : (data:{workId:string, workerId:string, userId:string}) => {
        api.post('/communication/chat/worker-offer', data)
    }
}



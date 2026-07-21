
interface AskBetterPriceModalProps {
    setAskBetterPriceModalOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function AskBetterPriceModal({ setAskBetterPriceModalOpen }:AskBetterPriceModalProps) {


    return (
        <div className="justify-center width-450 hight-400 ">
            <input type="text" placeholder="enter you price" />
            <button onClick={() => setAskBetterPriceModalOpen(false)}>close</button>
            <button>Ask</button>
        </div>
    )
}

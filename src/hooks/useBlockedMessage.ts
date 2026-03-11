/**
 * bloack time show acc was blocked to user
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const useBlockedMessage = () => {
  const [searchParams] = useSearchParams();
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("blocked") === "true") {
      setBlockedMessage("Your account has been blocked. Please contact WorkBee Admin support.");
    }
  }, [searchParams]);

  return blockedMessage;
};

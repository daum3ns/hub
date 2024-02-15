import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Container from "src/components/Container";
import { useInfo } from "src/hooks/useInfo";
import useSetupStore from "src/state/SetupStore";
import { useCSRF } from "src/hooks/useCSRF";
import { handleRequestError } from "src/utils/handleRequestError";
import { request } from "src/utils/request";
import Loading from "src/components/Loading";
import { SetupNodeInfo } from "src/types";
import React from "react";

export function SetupFinish() {
  const navigate = useNavigate();
  const { nodeInfo, unlockPassword } = useSetupStore();

  const { mutate: refetchInfo } = useInfo();
  const { data: csrf } = useCSRF();
  const [connectionError, setConnectionError] = React.useState(false);
  const hasFetchedRef = React.useRef(false);

  useEffect(() => {
    // ensure setup call is only called once
    if (!csrf || hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    (async () => {
      const succeeded = await finishSetup(csrf, nodeInfo, unlockPassword);
      if (succeeded) {
        await refetchInfo();
        navigate("/");
      } else {
        setConnectionError(true);
      }
    })();
  }, [csrf, nodeInfo, refetchInfo, navigate, unlockPassword]);

  if (connectionError) {
    return (
      <Container>
        <h1 className="font-semibold text-lg font-headline mt-16 mb-8 dark:text-white">
          Connection Failed
        </h1>

        <p>Navigate back to check your configuration, then try again.</p>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="font-semibold text-lg font-headline mt-16 mb-8 dark:text-white">
        Connecting...
      </h1>

      <Loading />
    </Container>
  );
}

const finishSetup = async (
  csrf: string,
  nodeInfo: SetupNodeInfo,
  unlockPassword: string
): Promise<boolean> => {
  try {
    await request("/api/setup", {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrf,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...nodeInfo,
        unlockPassword,
      }),
    });
    await request("/api/start", {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrf,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unlockPassword,
      }),
    });
    return true;
  } catch (error) {
    handleRequestError("Failed to connect", error);
    return false;
  }
};

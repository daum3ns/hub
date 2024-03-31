import { useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

import { EditIcon } from "src/components/icons/EditIcon";
import { useCSRF } from "src/hooks/useCSRF";
import {
  AppPermissions,
  BudgetRenewalType,
  CreateAppResponse,
  PermissionType,
  nip47PermissionDescriptions,
  validBudgetRenewals,
} from "src/types";

import { Button } from "src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import { Input } from "src/components/ui/input";
import { handleRequestError } from "src/utils/handleRequestError";
import { request } from "src/utils/request"; // build the project for this to appear
import Permissions from "../../components/Permissions";

const NewApp = () => {
  const { data: csrf } = useCSRF();
  const navigate = useNavigate();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [isEditing, setEditing] = useState(false);

  const nameParam = (queryParams.get("name") || queryParams.get("c")) ?? "";
  const [appName, setAppName] = useState(nameParam);
  const pubkey = queryParams.get("pubkey") ?? "";
  const returnTo = queryParams.get("return_to") ?? "";

  const budgetRenewalParam = queryParams.get(
    "budget_renewal"
  ) as BudgetRenewalType;
  const reqMethodsParam = queryParams.get("request_methods") ?? "";
  const maxAmountParam = queryParams.get("max_amount") ?? "";
  const expiresAtParam = queryParams.get("expires_at") ?? "";

  const parseRequestMethods = (reqParam: string): Set<PermissionType> => {
    const methods = reqParam
      ? reqParam.split(" ")
      : Object.keys(nip47PermissionDescriptions);
    // Create a Set of PermissionType from the array
    const requestMethodsSet = new Set<PermissionType>(
      methods as PermissionType[]
    );
    return requestMethodsSet;
  };

  const parseExpiresParam = (expiresParam: string): Date | undefined => {
    const expiresParamTimestamp = parseInt(expiresParam);
    if (!isNaN(expiresParamTimestamp)) {
      return new Date(expiresParamTimestamp * 1000);
    }
    return undefined;
  };

  const [permissions, setPermissions] = useState<AppPermissions>({
    requestMethods: parseRequestMethods(reqMethodsParam),
    maxAmount: parseInt(maxAmountParam || "100000"),
    budgetRenewal: validBudgetRenewals.includes(budgetRenewalParam)
      ? budgetRenewalParam
      : "monthly",
    expiresAt: parseExpiresParam(expiresAtParam),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!csrf) {
      throw new Error("No CSRF token");
    }

    try {
      const createAppResponse = await request<CreateAppResponse>("/api/apps", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: appName,
          pubkey,
          ...permissions,
          requestMethods: [...permissions.requestMethods].join(" "),
          expiresAt: permissions.expiresAt?.toISOString(),
          returnTo: returnTo,
        }),
      });

      if (!createAppResponse) {
        throw new Error("no create app response received");
      }

      if (createAppResponse.returnTo) {
        // open connection URI directly in an app
        window.location.href = createAppResponse.returnTo;
        return;
      }
      navigate("/apps/created", {
        state: createAppResponse,
      });
      toast.success("App created!");
    } catch (error) {
      handleRequestError("Failed to create app", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} acceptCharset="UTF-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {nameParam ? `Connect to ${appName}` : "Connect a new app"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!nameParam && (
            <>
              <label
                htmlFor="name"
                className="block font-medium text-gray-900 dark:text-white"
              >
                Name
              </label>
              <Input
                readOnly={!!nameParam}
                type="text"
                name="name"
                value={appName}
                id="name"
                onChange={(e) => setAppName(e.target.value)}
                required
                autoComplete="off"
              />
              <p className="mt-1 mb-6 text-xs text-gray-500 dark:text-gray-400">
                Name of the app or purpose of the connection
              </p>
            </>
          )}
          <div className="flex justify-between items-center mb-2 text-gray-800 dark:text-white">
            <p className="text-lg font-medium">Authorize the app to:</p>
            {!reqMethodsParam && !isEditing && (
              <EditIcon
                onClick={() => setEditing(true)}
                className="text-gray-800 dark:text-gray-300 cursor-pointer w-6"
              />
            )}
          </div>

          <Permissions
            initialPermissions={permissions}
            onPermissionsChange={setPermissions}
            isEditing={isEditing}
            isNew
          />
        </CardContent>
      </Card>
      <div className="mt-6 flex flex-col sm:flex-row sm:justify-center px-4 md:px-8">
        <Button type="submit" size={"lg"}>
          {pubkey ? "Connect" : "Next"}
        </Button>
      </div>
    </form>
  );
};

export default NewApp;

// This file is part of MinIO Console Server
// Copyright (c) 2021 MinIO, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { createStyles, Theme, withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import {
  actionsTray,
  searchField,
} from "../Common/FormComponents/common/styleLibrary";
import api from "../../../common/api";
import TableWrapper from "../Common/TableWrapper/TableWrapper";
import { AppState } from "../../../store";
import { setErrorSnackMessage } from "../../../actions";
import { NewServiceAccount } from "../Common/CredentialsPrompt/types";
import { stringSort } from "../../../utils/sortFunctions";
import { ErrorResponseHandler } from "../../../common/types";
import AddUserServiceAccount from "./AddUserServiceAccount";
import DeleteServiceAccount from "../Account/DeleteServiceAccount";
import CredentialsPrompt from "../Common/CredentialsPrompt/CredentialsPrompt";
import { CreateIcon } from "../../../icons";
import Button from "@material-ui/core/Button";

interface IUserServiceAccountsProps {
  classes: any;
  user: string;
  setErrorSnackMessage: typeof setErrorSnackMessage;
}

const styles = (theme: Theme) =>
  createStyles({
    ...searchField,
    ...actionsTray,
    actionsTray: {
      ...actionsTray.actionsTray,
    },
  });

const UserServiceAccountsPanel = ({
  classes,
  user,
  setErrorSnackMessage,
}: IUserServiceAccountsProps) => {
  const [records, setRecords] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [addScreenOpen, setAddScreenOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [selectedServiceAccount, setSelectedServiceAccount] = useState<
    string | null
  >(null);
  const [showNewCredentials, setShowNewCredentials] = useState<boolean>(false);
  const [newServiceAccount, setNewServiceAccount] =
    useState<NewServiceAccount | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (loading) {
      api
        .invoke("GET", `/api/v1/user/${user}/service-accounts`)
        .then((res: string[]) => {
          const serviceAccounts = res.sort(stringSort);

          setLoading(false);
          setRecords(serviceAccounts);
        })
        .catch((err: ErrorResponseHandler) => {
          setErrorSnackMessage(err);
          setLoading(false);
        });
    }
  }, [loading, setLoading, setRecords, setErrorSnackMessage, user]);

  const fetchRecords = () => {
    setLoading(true);
  };

  const closeAddModalAndRefresh = (res: NewServiceAccount | null) => {
    setAddScreenOpen(false);
    fetchRecords();

    if (res !== null) {
      const nsa: NewServiceAccount = {
        console: {
          accessKey: `${res.accessKey}`,
          secretKey: `${res.secretKey}`,
        },
      };
      setNewServiceAccount(nsa);
      setShowNewCredentials(true);
    }
  };

  const closeDeleteModalAndRefresh = (refresh: boolean) => {
    setDeleteOpen(false);

    if (refresh) {
      fetchRecords();
    }
  };

  const closeCredentialsModal = () => {
    setShowNewCredentials(false);
    setNewServiceAccount(null);
  };

  const confirmDeleteServiceAccount = (selectedServiceAccount: string) => {
    setSelectedServiceAccount(selectedServiceAccount);
    setDeleteOpen(true);
  };

  const tableActions = [
    { type: "delete", onClick: confirmDeleteServiceAccount },
  ];

  return (
    <React.Fragment>
      {addScreenOpen && (
        <AddUserServiceAccount
          open={addScreenOpen}
          closeModalAndRefresh={(res: NewServiceAccount | null) => {
            closeAddModalAndRefresh(res);
          }}
          user={user}
        />
      )}
      {deleteOpen && (
        <DeleteServiceAccount
          deleteOpen={deleteOpen}
          selectedServiceAccount={selectedServiceAccount}
          closeDeleteModalAndRefresh={(refresh: boolean) => {
            closeDeleteModalAndRefresh(refresh);
          }}
        />
      )}
      {showNewCredentials && (
        <CredentialsPrompt
          newServiceAccount={newServiceAccount}
          open={showNewCredentials}
          closeModal={() => {
            closeCredentialsModal();
          }}
          entity="Service Account"
        />
      )}
      <div className={classes.actionsTray}>
        <h1 className={classes.sectionTitle}>Service Accounts</h1>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CreateIcon />}
          onClick={() => {
            setAddScreenOpen(true);
            setAddScreenOpen(true);
            setSelectedServiceAccount(null);
          }}
        >
          Create service account
        </Button>
      </div>
      <br />
      <TableWrapper
        isLoading={loading}
        records={records}
        entityName={"Service Accounts"}
        idField={""}
        columns={[{ label: "Service Account", elementKey: "" }]}
        itemActions={tableActions}
      />
    </React.Fragment>
  );
};

const mapState = (state: AppState) => ({
  session: state.console.session,
});

const connector = connect(mapState, {
  setErrorSnackMessage,
});

export default withStyles(styles)(connector(UserServiceAccountsPanel));

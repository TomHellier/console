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

import React, { useEffect, useState, Fragment } from "react";
import { connect } from "react-redux";
import get from "lodash/get";
import * as reactMoment from "react-moment";
import clsx from "clsx";
import { createStyles, Theme, withStyles } from "@material-ui/core/styles";
import {
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
} from "@material-ui/core";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import List from "@material-ui/core/List";
import Grid from "@material-ui/core/Grid";
import Chip from "@material-ui/core/Chip";
import TextField from "@material-ui/core/TextField";
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import SearchIcon from "@material-ui/icons/Search";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import ShareFile from "./ShareFile";
import {
  actionsTray,
  buttonsStyles,
  containerForHeader,
  hrClass,
  searchField,
} from "../../../../Common/FormComponents/common/styleLibrary";
import { FileInfoResponse, IFileInfo } from "./types";
import {
  fileDownloadStarted,
  fileIsBeingPrepared,
  removeRouteLevel,
} from "../../../../ObjectBrowser/actions";
import { Route } from "../../../../ObjectBrowser/reducers";
import { download } from "../utils";
import { TabPanel } from "../../../../../shared/tabs";
import history from "../../../../../../history";
import api from "../../../../../../common/api";
import PageHeader from "../../../../Common/PageHeader/PageHeader";
import ShareIcon from "../../../../../../icons/ShareIcon";
import DownloadIcon from "../../../../../../icons/DownloadIcon";
import DeleteIcon from "../../../../../../icons/DeleteIcon";
import TableWrapper, {
  ItemActions,
} from "../../../../Common/TableWrapper/TableWrapper";
import { AppState } from "../../../../../../store";
import { ErrorResponseHandler } from "../../../../../../common/types";
import {
  setErrorSnackMessage,
  setSnackBarMessage,
} from "../../../../../../actions";
import PencilIcon from "../../../../Common/TableWrapper/TableActionIcons/PencilIcon";
import SetRetention from "./SetRetention";
import BrowserBreadcrumbs from "../../../../ObjectBrowser/BrowserBreadcrumbs";
import DeleteObject from "../ListObjects/DeleteObject";
import AddTagModal from "./AddTagModal";
import DeleteTagModal from "./DeleteTagModal";
import SetLegalHoldModal from "./SetLegalHoldModal";
import ScreenTitle from "../../../../Common/ScreenTitle/ScreenTitle";
import DescriptionIcon from "@material-ui/icons/Description";

const styles = (theme: Theme) =>
  createStyles({
    objectNameContainer: {
      marginBottom: 8,
    },
    objectPathContainer: {
      marginBottom: 26,
      fontSize: 10,
    },
    objectPathLink: {
      "&:visited": {
        color: "#000",
      },
    },
    objectName: {
      fontSize: 24,
    },
    propertiesContainer: {
      display: "flex",
      flexDirection: "row",
      marginBottom: 15,
    },
    propertiesItem: {
      display: "flex",
      flexDirection: "row",
      marginRight: 21,
    },
    propertiesItemBold: {
      fontWeight: 700,
    },
    propertiesValue: {
      marginLeft: 8,
      textTransform: "capitalize",
    },
    propertiesIcon: {
      marginLeft: 5,
    },
    actionsIconContainer: {
      marginLeft: 12,
    },
    actionsIcon: {
      height: 16,
      width: 16,
      "& .MuiSvgIcon-root": {
        height: 16,
      },
    },
    tagsContainer: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    tagText: {
      marginRight: 13,
    },
    tag: {
      marginRight: 6,
      fontSize: 10,
      fontWeight: 700,
      "&.MuiChip-sizeSmall": {
        height: 18,
      },
      "& .MuiSvgIcon-root": {
        height: 10,
        width: 10,
      },
    },
    search: {
      marginBottom: 8,
      "&.MuiFormControl-root": {
        marginRight: 0,
      },
    },
    paperContainer: {
      padding: 15,
      paddingLeft: 50,
      display: "flex",
    },
    elementTitle: {
      fontWeight: 500,
      color: "#777777",
      fontSize: 14,
      marginTop: -9,
    },
    dualCardLeft: {
      paddingRight: "5px",
    },
    dualCardRight: {
      paddingLeft: "5px",
    },
    capitalizeFirst: {
      textTransform: "capitalize",
    },
    titleCol: {
      width: "25%",
    },
    titleItem: {
      width: "35%",
    },

    "@global": {
      ".progressDetails": {
        paddingTop: 3,
        display: "inline-block",
        position: "relative",
        width: 18,
        height: 18,
      },
      ".progressDetails > .MuiCircularProgress-root": {
        position: "absolute",
        left: 0,
        top: 3,
      },
    },
    ...hrClass,
    ...buttonsStyles,
    ...actionsTray,
    ...searchField,
    ...containerForHeader(theme.spacing(4)),
  });

interface IObjectDetailsProps {
  classes: any;
  routesList: Route[];
  downloadingFiles: string[];
  rewindEnabled: boolean;
  rewindDate: any;
  bucketToRewind: string;
  distributedSetup: boolean;
  removeRouteLevel: (newRoute: string) => any;
  setErrorSnackMessage: typeof setErrorSnackMessage;
  setSnackBarMessage: typeof setSnackBarMessage;
  fileIsBeingPrepared: typeof fileIsBeingPrepared;
  fileDownloadStarted: typeof fileDownloadStarted;
}

const emptyFile: IFileInfo = {
  is_latest: true,
  last_modified: "",
  legal_hold_status: "",
  name: "",
  retention_mode: "",
  retention_until_date: "",
  size: "0",
  tags: {},
  version_id: null,
};

const ObjectDetails = ({
  classes,
  routesList,
  downloadingFiles,
  rewindEnabled,
  rewindDate,
  distributedSetup,
  bucketToRewind,
  removeRouteLevel,
  setErrorSnackMessage,
  setSnackBarMessage,
  fileIsBeingPrepared,
  fileDownloadStarted,
}: IObjectDetailsProps) => {
  const [loadObjectData, setLoadObjectData] = useState<boolean>(true);
  const [shareFileModalOpen, setShareFileModalOpen] = useState<boolean>(false);
  const [retentionModalOpen, setRetentionModalOpen] = useState<boolean>(false);
  const [tagModalOpen, setTagModalOpen] = useState<boolean>(false);
  const [deleteTagModalOpen, setDeleteTagModalOpen] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string[]>(["", ""]);
  const [legalholdOpen, setLegalholdOpen] = useState<boolean>(false);
  const [actualInfo, setActualInfo] = useState<IFileInfo>(emptyFile);
  const [versions, setVersions] = useState<IFileInfo[]>([]);
  const [filterVersion, setFilterVersion] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [metadataLoad, setMetadataLoad] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<any>({});
  const [selectedTab, setSelectedTab] = useState<number>(0);

  const currentItem = routesList[routesList.length - 1];
  const allPathData = currentItem.route.split("/");
  const objectName = allPathData[allPathData.length - 1];
  const bucketName = allPathData[2];
  const pathInBucket = allPathData.slice(3).join("/");

  useEffect(() => {
    if (loadObjectData) {
      const encodedPath = encodeURIComponent(pathInBucket);
      api
        .invoke(
          "GET",
          `/api/v1/buckets/${bucketName}/objects?prefix=${encodedPath}${
            distributedSetup ? "&with_versions=true" : ""
          }`
        )
        .then((res: IFileInfo[]) => {
          const result = get(res, "objects", []);
          if (distributedSetup) {
            setActualInfo(
              result.find((el: IFileInfo) => el.is_latest) || emptyFile
            );
            setVersions(result);
          } else {
            setActualInfo(result[0]);
            setVersions([]);
          }

          setLoadObjectData(false);
          setMetadataLoad(true);
        })
        .catch((error: ErrorResponseHandler) => {
          setErrorSnackMessage(error);
          setLoadObjectData(false);
        });
    }
  }, [
    loadObjectData,
    bucketName,
    pathInBucket,
    setErrorSnackMessage,
    distributedSetup,
  ]);

  useEffect(() => {
    if (metadataLoad) {
      const encodedPath = encodeURIComponent(pathInBucket);
      api
        .invoke(
          "GET",
          `/api/v1/buckets/${bucketName}/objects?prefix=${encodedPath}&with_metadata=true`
        )
        .then((res: FileInfoResponse) => {
          const fileData = res.objects[0];
          let metadata = get(fileData, "user_metadata", {});

          setMetadata(metadata);
          console.log("metadata:", res);
          setMetadataLoad(false);
        })
        .catch((error: ErrorResponseHandler) => {
          setMetadataLoad(false);
        });
    }
  }, [bucketName, metadataLoad, pathInBucket]);

  let tagKeys: string[] = [];

  if (actualInfo.tags) {
    tagKeys = Object.keys(actualInfo.tags);
  }

  const openRetentionModal = () => {
    setRetentionModalOpen(true);
  };

  const closeRetentionModal = (updateInfo: boolean) => {
    setRetentionModalOpen(false);
    if (updateInfo) {
      setLoadObjectData(true);
    }
  };

  const shareObject = () => {
    setShareFileModalOpen(true);
  };

  const closeShareModal = () => {
    setShareFileModalOpen(false);
  };

  const deleteTag = (tagKey: string, tagLabel: string) => {
    setSelectedTag([tagKey, tagLabel]);
    setDeleteTagModalOpen(true);
  };

  const removeDownloadAnimation = (path: string) => {
    fileDownloadStarted(path);
  };

  const downloadObject = (object: IFileInfo, includeVersion?: boolean) => {
    if (object.size && parseInt(object.size) > 104857600) {
      // If file is bigger than 100MB we show a notification
      setSnackBarMessage(
        "Download process started, it may take a few moments to complete"
      );
    }
    download(
      bucketName,
      pathInBucket,
      object.version_id,
      removeDownloadAnimation,
      includeVersion
    );
  };

  const tableActions: ItemActions[] = [
    {
      type: "share",
      onClick: shareObject,
      sendOnlyId: true,
      disableButtonFunction: (item: string) => {
        const element = versions.find((elm) => elm.version_id === item);
        if (element && element.is_delete_marker) {
          return true;
        }
        return false;
      },
    },
    {
      type: "download",
      onClick: (item: IFileInfo) => {
        downloadObject(item, true);
      },
      disableButtonFunction: (item: string) => {
        const element = versions.find((elm) => elm.version_id === item);
        if (element && element.is_delete_marker) {
          return true;
        }
        return false;
      },
    },
  ];

  const filteredRecords = versions.filter((version) => {
    if (version.version_id) {
      return version.version_id.includes(filterVersion);
    }
    return false;
  });

  const displayParsedDate = (date: string) => {
    return <reactMoment.default>{date}</reactMoment.default>;
  };

  const closeDeleteModal = (redirectBack: boolean) => {
    setDeleteOpen(false);

    if (redirectBack) {
      const newPath = allPathData.slice(0, -1).join("/");

      removeRouteLevel(newPath);
      history.push(newPath);
    }
  };

  const closeAddTagModal = (reloadObjectData: boolean) => {
    setTagModalOpen(false);

    if (reloadObjectData) {
      setLoadObjectData(true);
    }
  };

  const closeLegalholdModal = (reload: boolean) => {
    setLegalholdOpen(false);

    if (reload) {
      setLoadObjectData(true);
    }
  };

  const closeDeleteTagModal = (reloadObjectData: boolean) => {
    setDeleteTagModalOpen(false);

    if (reloadObjectData) {
      setLoadObjectData(true);
    }
  };

  return (
    <React.Fragment>
      {shareFileModalOpen && (
        <ShareFile
          open={shareFileModalOpen}
          closeModalAndRefresh={closeShareModal}
          bucketName={bucketName}
          dataObject={actualInfo}
        />
      )}
      {retentionModalOpen && (
        <SetRetention
          open={retentionModalOpen}
          closeModalAndRefresh={closeRetentionModal}
          objectName={objectName}
          objectInfo={actualInfo}
          bucketName={bucketName}
        />
      )}
      {deleteOpen && (
        <DeleteObject
          deleteOpen={deleteOpen}
          selectedBucket={bucketName}
          selectedObject={pathInBucket}
          closeDeleteModalAndRefresh={closeDeleteModal}
        />
      )}
      {tagModalOpen && (
        <AddTagModal
          modalOpen={tagModalOpen}
          currentTags={actualInfo.tags}
          selectedObject={pathInBucket}
          versionId={actualInfo.version_id}
          bucketName={bucketName}
          onCloseAndUpdate={closeAddTagModal}
        />
      )}
      {deleteTagModalOpen && (
        <DeleteTagModal
          deleteOpen={deleteTagModalOpen}
          currentTags={actualInfo.tags}
          selectedObject={pathInBucket}
          versionId={actualInfo.version_id}
          bucketName={bucketName}
          onCloseAndUpdate={closeDeleteTagModal}
          selectedTag={selectedTag}
        />
      )}
      {legalholdOpen && (
        <SetLegalHoldModal
          open={legalholdOpen}
          closeModalAndRefresh={closeLegalholdModal}
          objectName={pathInBucket}
          bucketName={bucketName}
          actualInfo={actualInfo}
        />
      )}
      <PageHeader label={"Object Browser"} />

      <Grid container className={classes.container}>
        <Grid item xs={12}>
          <ScreenTitle
            icon={
              <Fragment>
                <DescriptionIcon style={{ width: 40, height: 40 }} />
              </Fragment>
            }
            title={objectName}
            subTitle={
              <Fragment>
                <BrowserBreadcrumbs title={false} />
              </Fragment>
            }
            actions={
              <Fragment>
                <Tooltip title="Share">
                  <IconButton
                    color="primary"
                    aria-label="share"
                    onClick={() => {
                      shareObject();
                    }}
                    disabled={actualInfo.is_delete_marker}
                  >
                    <ShareIcon />
                  </IconButton>
                </Tooltip>

                {downloadingFiles.includes(
                  `${bucketName}/${actualInfo.name}`
                ) ? (
                  <div className="progressDetails">
                    <CircularProgress
                      color="primary"
                      size={17}
                      variant="indeterminate"
                    />
                  </div>
                ) : (
                  <Tooltip title="Download">
                    <IconButton
                      color="primary"
                      aria-label="download"
                      onClick={() => {
                        downloadObject(actualInfo);
                      }}
                      disabled={actualInfo.is_delete_marker}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title="Delete Object">
                  <IconButton
                    color="primary"
                    aria-label="delete"
                    onClick={() => {
                      setDeleteOpen(true);
                    }}
                    disabled={actualInfo.is_delete_marker}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Fragment>
            }
          />
        </Grid>
        <Grid item xs={2}>
          <List component="nav" dense={true}>
            <ListItem
              button
              selected={selectedTab === 0}
              onClick={() => {
                setSelectedTab(0);
              }}
            >
              <ListItemText primary="Details" />
            </ListItem>
            <ListItem
              button
              selected={selectedTab === 1}
              onClick={() => {
                setSelectedTab(1);
              }}
              disabled={
                !(actualInfo.version_id && actualInfo.version_id !== "null")
              }
            >
              <ListItemText primary="Versions" />
            </ListItem>
          </List>
        </Grid>
        <Grid item xs={10}>
          <Grid item xs={12}>
            <TabPanel index={0} value={selectedTab}>
              <div className={classes.actionsTray}>
                <h1 className={classes.sectionTitle}>Details</h1>
              </div>
              <br />
              <Paper className={classes.paperContainer}>
                <Grid container>
                  <Grid item xs={10}>
                    <table width={"100%"}>
                      <tbody>
                        <tr>
                          <td className={classes.titleCol}>Legal Hold:</td>
                          <td className={classes.capitalizeFirst}>
                            {actualInfo.version_id &&
                            actualInfo.version_id !== "null" ? (
                              <Fragment>
                                {actualInfo.legal_hold_status
                                  ? actualInfo.legal_hold_status.toLowerCase()
                                  : "Off"}
                                <IconButton
                                  color="primary"
                                  aria-label="legal-hold"
                                  size="small"
                                  className={classes.propertiesIcon}
                                  onClick={() => {
                                    setLegalholdOpen(true);
                                  }}
                                >
                                  <PencilIcon active={true} />
                                </IconButton>
                              </Fragment>
                            ) : (
                              "Disabled"
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className={classes.titleCol}>Retention:</td>
                          <td className={classes.capitalizeFirst}>
                            {actualInfo.retention_mode
                              ? actualInfo.retention_mode.toLowerCase()
                              : "Undefined"}
                            <IconButton
                              color="primary"
                              aria-label="retention"
                              size="small"
                              className={classes.propertiesIcon}
                              onClick={() => {
                                openRetentionModal();
                              }}
                            >
                              <PencilIcon active={true} />
                            </IconButton>
                          </td>
                        </tr>
                        <tr>
                          <td className={classes.titleCol}>Tags:</td>
                          <td>
                            {tagKeys &&
                              tagKeys.map((tagKey, index) => {
                                const tag = get(
                                  actualInfo,
                                  `tags.${tagKey}`,
                                  ""
                                );
                                if (tag !== "") {
                                  return (
                                    <Chip
                                      key={`chip-${index}`}
                                      className={classes.tag}
                                      size="small"
                                      label={`${tagKey} : ${tag}`}
                                      color="primary"
                                      deleteIcon={<CloseIcon />}
                                      onDelete={() => {
                                        deleteTag(tagKey, tag);
                                      }}
                                    />
                                  );
                                }
                                return null;
                              })}
                            <Chip
                              className={classes.tag}
                              icon={<AddIcon />}
                              clickable
                              size="small"
                              label="Add tag"
                              color="primary"
                              variant="outlined"
                              onClick={() => {
                                setTagModalOpen(true);
                              }}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </Grid>
                </Grid>
              </Paper>
              <br />
              <br />
              <Paper className={classes.paperContainer}>
                <Grid item xs={12}>
                  <Grid item xs={12}>
                    <h2>Object Metadata</h2>
                    <hr className={classes.hr}></hr>
                  </Grid>

                  <Grid item xs={12}>
                    <Table className={classes.table} aria-label="simple table">
                      <TableBody>
                        {Object.keys(metadata).map((element) => {
                          return (
                            <TableRow>
                              <TableCell
                                component="th"
                                scope="row"
                                className={classes.titleItem}
                              >
                                {element}
                              </TableCell>
                              <TableCell align="right">
                                {metadata[element]}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Grid>
                </Grid>
              </Paper>
            </TabPanel>
            <TabPanel index={1} value={selectedTab}>
              <Fragment>
                <div className={classes.actionsTray}>
                  <h1 className={classes.sectionTitle}>Versions</h1>
                </div>
                <br />
                <Grid item xs={12} className={classes.actionsTray}>
                  {actualInfo.version_id && actualInfo.version_id !== "null" && (
                    <TextField
                      placeholder={`Search ${objectName}`}
                      className={clsx(classes.search, classes.searchField)}
                      id="search-resource"
                      label=""
                      onChange={(val) => {
                        setFilterVersion(val.target.value);
                      }}
                      InputProps={{
                        disableUnderline: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                </Grid>
                <Grid item xs={12}>
                  {actualInfo.version_id && actualInfo.version_id !== "null" && (
                    <TableWrapper
                      itemActions={tableActions}
                      columns={[
                        {
                          label: "",
                          width: 20,
                          renderFullObject: true,
                          renderFunction: (r) => {
                            const versOrd =
                              versions.length - versions.indexOf(r);
                            return `v${versOrd}`;
                          },
                        },
                        { label: "Version ID", elementKey: "version_id" },
                        {
                          label: "Last Modified",
                          elementKey: "last_modified",
                          renderFunction: displayParsedDate,
                        },
                        {
                          label: "Deleted",
                          width: 60,
                          contentTextAlign: "center",
                          renderFullObject: true,
                          renderFunction: (r) => {
                            const versOrd = r.is_delete_marker ? "Yes" : "No";
                            return `${versOrd}`;
                          },
                        },
                      ]}
                      isLoading={false}
                      entityName="Versions"
                      idField="version_id"
                      records={filteredRecords}
                    />
                  )}
                </Grid>
              </Fragment>
            </TabPanel>
          </Grid>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

const mapStateToProps = ({ objectBrowser, system }: AppState) => ({
  downloadingFiles: get(objectBrowser, "downloadingFiles", []),
  rewindEnabled: get(objectBrowser, "rewind.rewindEnabled", false),
  rewindDate: get(objectBrowser, "rewind.dateToRewind", null),
  bucketToRewind: get(objectBrowser, "rewind.bucketToRewind", ""),
  distributedSetup: get(system, "distributedSetup", false),
});

const mapDispatchToProps = {
  removeRouteLevel,
  setErrorSnackMessage,
  fileIsBeingPrepared,
  fileDownloadStarted,
  setSnackBarMessage,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(withStyles(styles)(ObjectDetails));

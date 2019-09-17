/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import React from 'react';
import {FlexColumn, FlexRow} from 'flipper';
import {connect} from 'react-redux';
import TitleBar from './chrome/TitleBar';
import MainSidebar from './chrome/MainSidebar';
import BugReporterDialog from './chrome/BugReporterDialog';
import ErrorBar from './chrome/ErrorBar';
import ShareSheet from './chrome/ShareSheet';
import SignInSheet from './chrome/SignInSheet';
import ExportDataPluginSheet from './chrome/ExportDataPluginSheet';
import ShareSheetExportFile from './chrome/ShareSheetExportFile';
import PluginContainer from './PluginContainer';
import Sheet from './chrome/Sheet';
import {ipcRenderer, remote} from 'electron';
import PluginDebugger from './chrome/PluginDebugger';
import {
  ActiveSheet,
  ShareType,
  ACTIVE_SHEET_BUG_REPORTER,
  ACTIVE_SHEET_PLUGIN_DEBUGGER,
  ACTIVE_SHEET_SHARE_DATA,
  ACTIVE_SHEET_SIGN_IN,
  ACTIVE_SHEET_SHARE_DATA_IN_FILE,
  ACTIVE_SHEET_SELECT_PLUGINS_TO_EXPORT,
  ACTIVE_SHEET_PLUGIN_SHEET,
  ACTIVE_SHEET_PLUGIN_INSTALLER,
} from './reducers/application';
import {Logger} from './fb-interfaces/Logger';
import BugReporter from './fb-stubs/BugReporter';
import {State as Store} from './reducers/index';
import {StaticView} from './reducers/connections';
import PluginInstaller from './chrome/PluginInstaller';
const version = remote.app.getVersion();

type OwnProps = {
  logger: Logger;
  bugReporter: BugReporter;
};

type StateFromProps = {
  leftSidebarVisible: boolean;
  error: string | null;
  activeSheet: ActiveSheet;
  share: ShareType | null;
  staticView: StaticView;
};

type Props = StateFromProps & OwnProps;

export class App extends React.Component<Props> {
  componentDidMount() {
    // track time since launch
    const [s, ns] = process.hrtime();
    const launchEndTime = s * 1e3 + ns / 1e6;
    ipcRenderer.on('getLaunchTime', (_: any, launchStartTime: number) => {
      this.props.logger.track(
        'performance',
        'launchTime',
        launchEndTime - launchStartTime,
      );
    });
    ipcRenderer.send('getLaunchTime');
    ipcRenderer.send('componentDidMount');
  }

  getSheet = (onHide: () => any) => {
    const {activeSheet} = this.props;
    switch (activeSheet) {
      case ACTIVE_SHEET_BUG_REPORTER:
        return (
          <BugReporterDialog
            bugReporter={this.props.bugReporter}
            onHide={onHide}
          />
        );
      case ACTIVE_SHEET_PLUGIN_DEBUGGER:
        return <PluginDebugger onHide={onHide} />;
      case ACTIVE_SHEET_SHARE_DATA:
        return <ShareSheet onHide={onHide} logger={this.props.logger} />;
      case ACTIVE_SHEET_SIGN_IN:
        return <SignInSheet onHide={onHide} />;
      case ACTIVE_SHEET_SELECT_PLUGINS_TO_EXPORT:
        return <ExportDataPluginSheet onHide={onHide} />;
      case ACTIVE_SHEET_PLUGIN_INSTALLER:
        return <PluginInstaller onHide={onHide} />;
      case ACTIVE_SHEET_SHARE_DATA_IN_FILE:
        return (
          <ShareSheetExportFile
            onHide={onHide}
            file={
              this.props.share && this.props.share.type === 'file'
                ? this.props.share.file
                : undefined
            }
            logger={this.props.logger}
          />
        );
      case ACTIVE_SHEET_PLUGIN_SHEET:
        // Currently unused.
        return null;
      default:
        return null;
    }
  };

  render() {
    return (
      <FlexColumn grow={true}>
        <TitleBar version={version} />
        <Sheet>{this.getSheet}</Sheet>
        <FlexRow grow={true}>
          {this.props.leftSidebarVisible && <MainSidebar />}
          {this.props.staticView != null ? (
            React.createElement(this.props.staticView)
          ) : (
            <PluginContainer logger={this.props.logger} />
          )}
        </FlexRow>
        <ErrorBar text={this.props.error} />
      </FlexColumn>
    );
  }
}

export default connect<StateFromProps, {}, OwnProps, Store>(
  ({
    application: {leftSidebarVisible, activeSheet, share},
    connections: {error, staticView},
  }) => ({
    leftSidebarVisible,
    activeSheet,
    share: share,
    error,
    staticView,
  }),
)(App);

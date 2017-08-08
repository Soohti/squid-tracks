import React from 'react';
import { Grid, Row, Col, Button } from 'react-bootstrap';
import ResultsSummaryCard from './components/results-summary-card';
import ResultsCard from './components/results-card';
import ResultDetailCard from './components/result-detail-card';
const { ipcRenderer } = window.require('electron');

const Results = () =>
  <Grid fluid>
    <Row>
      <Col md={12}>
        <ResultsContainer />
      </Col>
    </Row>
  </Grid>;

class ResultsPoller extends React.Component {
  state = {
    active: false
  };

  start = () => {
    this.setState({ active: true });
  };

  stop = () => {
    this.setState({ active: false });
  };

  poll = () => {
    this.props.getRecords();
    if (this.state.active) {
      setTimeout(this.poll, 120000); // 2 minutes
    }
  };

  render() {
    return <Button>Poll for New Battles</Button>;
  }
}

class ResultsContainer extends React.Component {
  state = {
    results: {
      summary: {},
      results: []
    },
    currentResult: {}
  };

  componentDidMount() {
    this.getRecords();
  }

  getRecords() {
    const results = ipcRenderer.sendSync('getApi', 'results');
    this.setState({ results: results });
    this.changeResult(results.results[0].battle_number);
    this.setState({ initialized: true });
  }

  changeResult = battleNumber => {
    this.setState({
      currentResult: ipcRenderer.sendSync('getApi', `results/${battleNumber}`)
    });
  };

  render() {
    return (
      <div>
        <Button onClick={() => this.getRecords()}>Refresh</Button>
        <ResultsSummaryCard summary={this.state.results.summary} />
        {this.state.initialized
          ? <ResultDetailCard
              result={this.state.currentResult}
              changeResult={this.changeResult}
              latestBattleNumber={this.state.results.results[0].battle_number}
            />
          : null}
        <ResultsCard
          results={this.state.results.results}
          changeResult={this.changeResult}
        />
      </div>
    );
  }
}

export default Results;

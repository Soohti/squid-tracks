import React from 'react';
import { Subscriber } from 'react-broadcast';
import { FormattedDate, FormattedTime, FormattedMessage } from 'react-intl';
import { Grid, Row, Col, Image, Panel } from 'react-bootstrap';
import './salmon.css';

const SalmonDay = ({ schedules, unixTime }) => {
  if (unixTime == null) {
    return <div className="salmon-day" />;
  }

  const { times, day } = getTimesWithinDay(unixTime, schedules);
  let lastTime = times[0];
  return (
    <div className="salmon-day">
      {times.map(time => {
        const height = (time.time - lastTime.time) / 864;
        lastTime = time;
        return (
          <div
            className={`cell ${!time.isStart ? 'work' : undefined}`}
            style={{ height: `${height}%` }}
          />
        );
      })}
      <div className="date">{day.getDate()}</div>
    </div>
  );
};

function getTimesWithinDay(unixTime, schedules) {
  const day = new Date(unixTime * 1000);
  const dayStart = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    0,
    0,
    0
  );
  const unixStart = dayStart.getTime() / 1000;
  const unixEnd = unixStart + 86400;
  const times = [];

  let allDay = false;
  for (const s of schedules) {
    if (s.start_time >= unixStart && s.start_time < unixEnd) {
      times.push({ time: s.start_time, isStart: true });
    }

    if (s.end_time > unixStart && s.end_time <= unixEnd) {
      times.push({ time: s.end_time, isStart: false });
    }

    if (unixStart >= s.start_time && unixEnd <= s.end_time) {
      allDay = true;
    }
  }

  if (times.length > 0) {
    times.unshift({ time: unixStart, isStart: !times[0].isStart });
    times.push({ time: unixEnd, isStart: !times[times.length - 1].isStart });
  }

  if (allDay) {
    times.push({ time: unixStart, isStart: true });
    times.push({ time: unixEnd, isStart: false });
  }

  return { times, day };
}

function getPartsWithinDay({ unixDayStart, unixDayEnd, times }) {
  const fraction1 = (times[0].time - unixDayStart) / 864; // 100 / seconds in day
  const isSalmon1 = !times[0].isStart;
  const fraction2 = (times[1].time - times[0].time) / 864;
  const isSalmon2 = times[0].isStart;
  const fraction3 = (unixDayEnd - times[1]) / 864;
  const isSalmon = times[1].isStart;
}

const SalmonCalendar = ({ schedules }) => {
  if (schedules == null || schedules.length <= 0) {
    return null;
  }

  const startDate = new Date(schedules[0].start_time * 1000);
  const startDow = startDate.getDay();
  const endDate = new Date(schedules[schedules.length - 1].end_time * 1000);

  const calendar = [];
  // pad start of week
  let currentWeek = [];
  for (let i = 0; i < startDow; i++) {
    currentWeek.push(<SalmonDay key={`blank.${i}`} />);
  }

  for (let i = startDate; i <= endDate; i.setDate(i.getDate() + 1)) {
    if (i.getDay() === 0) {
      currentWeek = [];
    }
    currentWeek.push(
      <SalmonDay
        key={i.getDate()}
        unixTime={i.getTime() / 1000}
        schedules={schedules}
      />
    );
    if (i.getDay() === 6) {
      calendar.push(<div key={i.getDate()}>{currentWeek}</div>);
    }
  }
  if (currentWeek.length < 6) {
    calendar.push(<div key={endDate.getDate()}>{currentWeek}</div>);
  }

  return (
    <div>
      <div>
        <div className="salmon-day header">S</div>
        <div className="salmon-day header">M</div>
        <div className="salmon-day header">T</div>
        <div className="salmon-day header">W</div>
        <div className="salmon-day header">T</div>
        <div className="salmon-day header">F</div>
        <div className="salmon-day header">S</div>
      </div>
      {calendar}
    </div>
  );
};

const SalmonDetail = ({ detail }) => {
  const now = new Date().getTime() / 1000;
  const active = now < detail.end_time && now > detail.start_time;
  return (
    <Panel>
      <Panel.Heading
        style={
          active ? { background: 'darkorange', color: 'white' } : undefined
        }
      >
        {active ? (
          <FormattedMessage id="salmon.active" defaultMessage="Active until " />
        ) : (
          <React.Fragment>
            <FormattedDate
              value={new Date(detail.start_time * 1000)}
              month="numeric"
              day="2-digit"
            />{' '}
            <FormattedTime value={new Date(detail.start_time * 1000)} />
            {' - '}
          </React.Fragment>
        )}
        <FormattedDate
          value={new Date(detail.end_time * 1000)}
          month="numeric"
          day="2-digit"
        />{' '}
        <FormattedTime value={new Date(detail.end_time * 1000)} />
      </Panel.Heading>
      <Panel.Body>
        <h4 style={{ marginTop: 0 }}>{detail.stage.name}</h4>
        <Image
          src={`https://app.splatoon2.nintendo.net${detail.stage.image}`}
          style={{ maxHeight: 100, marginBottom: 10 }}
          alt={detail.stage.name}
        />
        <br />
        {detail.weapons.map((weapon, i) => (
          <Image
            key={i}
            src={`https://app.splatoon2.nintendo.net${weapon.thumbnail}`}
            style={{ maxHeight: 40 }}
            alt={weapon.name}
          />
        ))}
      </Panel.Body>
    </Panel>
  );
};

class Salmon extends React.Component {
  componentDidMount() {
    this.props.splatnet.comm.updateCoop();
  }

  render() {
    const { splatnet } = this.props;
    const { coop_schedules } = splatnet.current;
    return (
      <Grid fluid style={{ paddingTop: 65 }}>
        <Row>
          <Col md={4}>
            <h1>
              <FormattedMessage
                id="salmon.title"
                defaultMessage="Shift Schedule"
              />
            </h1>
            {coop_schedules.details.map(d => (
              <SalmonDetail key={d.start_time} detail={d} />
            ))}
          </Col>
          <Col md={12}>
            <SalmonCalendar schedules={coop_schedules.schedules} />
          </Col>
        </Row>
      </Grid>
    );
  }
}

const SalmonWithSplatnet = () => {
  return (
    <Subscriber channel="splatnet">
      {splatnet => <Salmon splatnet={splatnet} />}
    </Subscriber>
  );
};

export default SalmonWithSplatnet;

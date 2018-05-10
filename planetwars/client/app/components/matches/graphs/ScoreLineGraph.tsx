import * as React from 'react';
import { Component } from 'react';
import * as d3 from 'd3';

import { Graph, Section, color, SectionProps } from './Shared';
import { ticks } from 'd3';
import { DeathEvent, Player } from './MatchLog';

// tslint:disable-next-line:no-var-requires
const styles = require('./GraphView.scss');

export interface State {
  players: PSelectStatus[];
}

export interface PSelectStatus {
  player: Player;
  selected: boolean;
}

export class ScoreLineGraphSection extends Section<State> {
  public state = {} as State;

  public static getDerivedStateFromProps(nextProps: SectionProps, prevState: State): State {
    const players = nextProps.log.players.map((player) => ({ player, selected: true }));
    return { players };
  }

  public render() {
    const log = this.props.log;
    const turns = log.gameStates.map((gs, turn) => ({
      turn,
      players: gs.players.map((p) => ({
        player: p.index,
        amountOfShips: p.shipsOwned,
        amountOfPlanets: p.planetsOwned,
      })),
    }));
    const onChange = (players: PSelectStatus[]) => this.setState({ players });
    const width = 800;
    const height = 400;
    const data = { turns, eliminations: log.eliminations, selectedPlayers: this.state.players };
    return (
      <div className={styles.scoreLineGraph}>
        <PlayerSelector players={this.state.players} onChange={onChange} />
        <ScoreLineGraph width={width} height={height} data={data} />
      </div>
    );
  }
}

export interface DataProps {
  eliminations: DeathEvent[];
  turns: Turn[];
  selectedPlayers: PSelectStatus[];
}

export interface Turn {
  turn: number;
  players: PlayerSnapshot[];
}

export interface PlayerSnapshot {
  player: number;
  amountOfShips: number;
  amountOfPlanets: number;
}

export class ScoreLineGraph extends Graph<DataProps> {
  protected createGraph(): void {
    const { data: { eliminations, turns } } = this.props;
    const node = this.node;
    const svg = d3.select(node);
    const players = (turns[0]) ? turns[0].players.map((p) => p.player) : [];
    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const width = this.props.width - margin.left - margin.right;
    const height = this.props.height - margin.top - margin.top;

    // Clear old graph
    svg.selectAll('*').remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear<number>()
      .domain([0, turns.length])
      .rangeRound([0, width]);

    const maxShips = d3.max(turns, (t) => d3.max(t.players, (p) => p.amountOfShips));
    const maxY = maxShips ? (maxShips + 1) : 1;
    const y = d3.scaleLinear<number>()
      .domain([0, maxY])
      .range([height, 0]);

    // Lines
    players.forEach((pId) => {
      const line = d3.line<Turn>()
        .x((d) => x(d.turn) as number)
        .y((d) => y(d.players[pId].amountOfShips) || 0);

      g.append("path")
        .datum(turns)
        .attr("fill", "none")
        .attr("stroke", color(pId.toString()))
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .transition().duration(750)
        .attr("d", line);
    });

    // Grid
    g.append('g')
      .attr('class', styles.grid)
      // .attr('transform', `translate(0, ${height})`)
      .call(d3
        .axisLeft(y)
        .ticks(5)
        .tickSize(-width)
        .tickFormat(null));

    // X axis
    g.append("g")
      .attr('transform', `translate(0, ${height})`)
      .attr('class', styles.xAxis)
      .call(d3
        .axisBottom(x)
        .tickValues(d3.ticks(0, turns.length, 10))
        .tickSizeOuter(0),
    );

    // Right Y Axis
    g.append("g")
      .attr('class', styles.yAxis)
      .attr('transform', `translate(${width}, 0)`)
      .call(d3
        .axisRight(y)
        .ticks(5, 'd')
        .tickSizeOuter(0)
        .tickSizeInner(0));

    // Left Y axis (label)
    g.append("g")
      .attr('class', styles.yAxis)
      .call(d3.axisLeft(y).ticks(0, 'd'))
      .append("text")
      .attr("dx", "120px")
      .text("Amount of ships");

    // Death Markers
    const cross = d3.symbol().size(50).type(d3.symbolCross);
    g.append('g')
      .selectAll(`.${styles.deathMarker}`)
      .data(eliminations)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${x(d.turn)}, ${y(0)})`)
      .append('path')
      .attr('d', cross)
      .attr('transform', 'rotate(45)')
      .attr('class', styles.deathMarker)
      .attr('fill', (d) => color(d.player.toString()));

  }

  protected updateGraph(): void {
    this.createGraph();
  }
}

export interface PlayerSelectorProps {
  players: PSelectStatus[];
  onChange(players: PSelectStatus[]): void;
}

export class PlayerSelector extends Component<PlayerSelectorProps> {

  public render() {
    const { players } = this.props;
    const lis = players.map((p, i) => {
      const selected = (p.selected) ? styles.selected : '';
      return (
        <li
          style={{ backgroundColor: color(p.player.id.toString()) }}
          className={`${styles.player} ${selected}`}
          key={i}
          // tslint:disable-next-line:jsx-no-lambda
          onClick={() => this.onClick(i)}
        >
          <span>{p.player.name}</span>
        </li>
      );
    });
    return (
      <ul className={styles.playerList}>
        {lis}
      </ul>);
  }

  private onClick(i: number) {
    const players = [...this.props.players];
    players[i].selected = !players[i].selected;
    this.setState({ players });
    this.props.onChange(players);
  }
}

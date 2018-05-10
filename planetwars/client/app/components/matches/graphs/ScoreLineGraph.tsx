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
    const selectedPlayers = new Set(this.state.players
      .filter((sp) => sp.selected)
      .map((sp) => sp.player.id));
    const players = this.state.players.map((sp) => sp.player);
    const eliminations = log.eliminations;
    const data = { turns, eliminations, selectedPlayers, players };
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
  selectedPlayers: Set<number>;
  players: Player[];
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

  private svg: d3.Selection<SVGSVGElement, {}, null, undefined>;
  private margin = { top: 20, right: 50, bottom: 30, left: 50 };
  private width: number;
  private height: number;
  private root: d3.Selection<d3.BaseType, {}, null, undefined>;
  private grid: d3.Selection<d3.BaseType, {}, null, undefined>;
  private leftYAxis: d3.Selection<d3.BaseType, {}, null, undefined>;
  private rightYAxis: d3.Selection<d3.BaseType, {}, null, undefined>;
  private xAxis: d3.Selection<d3.BaseType, {}, null, undefined>;
  private deathMarks: d3.Selection<d3.BaseType, DeathEvent, d3.BaseType, {}>;
  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;
  private lines: d3.Selection<d3.BaseType, Turn[], null, undefined>[] = [];

  protected createGraph(): void {
    const { data: { eliminations, turns, selectedPlayers, players } } = this.props;
    const node = this.node;
    const margin = this.margin;

    this.svg = d3.select(node);
    this.width = this.props.width - margin.left - margin.right;
    this.height = this.props.height - margin.top - margin.top;

    this.svg.selectAll('*').remove();

    this.root = this.svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    this.xScale = this.getXScale();
    this.yScale = this.getYScale();
    const x = this.xScale;
    const y = this.yScale;

    // Lines
    players.forEach((p) => {
      if (!selectedPlayers.has(p.id)) { return; }
      const line = this.root.append("path")
        .datum(turns)
        .attr("fill", "none")
        .attr("stroke", color(p.id.toString()))
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", this.line(p));
      this.lines.push(line);
    });

    this.grid = this.root.append('g')
      .attr('class', styles.grid)
      .call(this.gridDraw());

    this.xAxis = this.root.append("g")
      .attr('transform', `translate(0, ${this.height})`)
      .attr('class', styles.xAxis)
      .call(this.xAxisDraw());

    this.rightYAxis = this.root.append("g")
      .attr('class', styles.yAxis)
      .attr('transform', `translate(${this.width}, 0)`)
      .call(this.rightYAxisDraw());

    this.leftYAxis = this.root.append("g")
      .attr('class', styles.yAxis)
      .call(this.leftYAxisDraw())
      .append("text")
      .attr("dx", "120px")
      .text("Amount of ships");

    // Death Markers
    const cross = d3.symbol().size(50).type(d3.symbolCross);
    this.deathMarks = this.root.append('g')
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
    // if (this.props.data.players.length !== this.lines.length) {
    //   this.createGraph();
    // }

    this.xScale = this.getXScale();
    this.yScale = this.getYScale();
    const dur = 750;

    this.leftYAxis
      .transition().duration(dur)
      .call(this.leftYAxisDraw() as any);

    this.rightYAxis
      .transition().duration(dur)
      .call(this.rightYAxisDraw() as any);

    this.grid
      .transition().duration(dur)
      .call(this.gridDraw() as any);

    const { players, selectedPlayers } = this.props.data;
    this.props.data.players.forEach((p, i) => {
      if (selectedPlayers.has(p.id)) {
        this.lines[i]
          .transition().duration(dur)
          .style('opacity', '1')
          .attr('d', this.line(p));

      } else {
        this.lines[i]
          .transition().duration(dur)
          .style('opacity', '0')
          .attr('d', this.flatLine());
      }
    });
  }

  private line(p: Player) {
    return d3.line<Turn>()
      .x((d) => this.xScale(d.turn))
      .y((d) => this.yScale(d.players[p.id].amountOfShips) || 0);

  }

  private flatLine() {
    return d3.line<Turn>()
      .x((d) => this.xScale(d.turn))
      .y((d) => 0);
  }

  private getXScale() {
    const { data: { turns } } = this.props;
    const x = d3.scaleLinear<number>()
      .domain([0, turns.length])
      .rangeRound([0, this.width]);
    return x;
  }

  private getYScale() {
    const { data: { turns, selectedPlayers } } = this.props;
    const players = (t: Turn) => t.players.filter((_, i) => selectedPlayers.has(i));
    const maxShips = d3.max(turns, (t) => d3.max(players(t), (p) => p.amountOfShips));
    const maxY = maxShips ? (maxShips + 1) : 1;
    const y = d3.scaleLinear<number>()
      .domain([0, maxY])
      .range([this.height, 0]);
    return y;
  }

  private xAxisDraw() {
    return d3
      .axisBottom(this.xScale)
      .ticks(10)
      .tickSizeOuter(0);
  }

  private gridDraw() {
    return d3
      .axisLeft(this.yScale)
      .ticks(5)
      .tickSize(-this.width)
      .tickFormat(null);
  }

  private leftYAxisDraw() {
    return d3.axisLeft(this.yScale).ticks(0, 'd');
  }

  private rightYAxisDraw() {
    return d3
      .axisRight(this.yScale)
      .ticks(5, 'd')
      .tickSizeOuter(0)
      .tickSizeInner(0);
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

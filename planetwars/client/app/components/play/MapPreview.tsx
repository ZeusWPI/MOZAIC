import * as React from 'react';
import * as d3 from 'd3';
import * as fs from 'fs';

import * as M from '@/database/models';
import { JsonPlanet } from '@/database/migrationV3';

const _colors = [
  '#DE8D47', // (orange) Main Primary color
  '#2C8286', // (teal) Main Complement color
  '#9ECE43', // (green) Free style
  '#DE4B47', // (red) Free style
  '#553C99', // (purple) Main Secondary color (2)
  '#B4397C', // (pink) Adjacent
  '#DEC547', // (yellow) Main Secondary color (1)
];

export const color = d3.scaleOrdinal(_colors);

import * as css from './PlayPage.scss';

export interface StaticPlanet {
  x: number;
  y: number;
  owner: number;
  index: number;
  name: string;
}

export interface MapViewData {
  planets: StaticPlanet[];
  min: { x: number, y: number };
  max: { x: number, y: number };
  selected: boolean;
}

export interface MapViewProps {
  data: MapViewData;
  width: number;
  height: number;
}

export abstract class MapView extends React.Component<MapViewProps> {
  protected node!: SVGSVGElement;

  private svg!: d3.Selection<SVGSVGElement, {}, null, undefined>;
  private root!: d3.Selection<d3.BaseType, {}, null, undefined>;

  constructor(props: MapViewProps) {
    super(props);
    this.createGraph = this.createGraph.bind(this);
  }

  public componentDidMount() {
    this.createGraph();
  }

  public componentDidUpdate() {
    this.updateGraph();
  }

  public render() {
    return (
      <div className={""} >
        <svg
          className={""}
          ref={(node: SVGSVGElement) => this.node = node}
          width={this.props.width}
          height={this.props.height}
        />
      </div>
    );
  }
  protected createGraph(): void {
    const { data, width, height } = this.props;
    const { min, max, planets } = data;

    const minRadius = 2;
    const maxRadius = 10;

    const x = d3.scaleLinear()
      .domain([min.x - 0.1, max.x + 0.1])
      .range([0 + maxRadius, width - maxRadius]);
    const y = d3.scaleLinear()
      .domain([min.y - 0.1, max.y + 0.1])
      .range([0 + maxRadius, height - maxRadius]);

    this.svg = d3.select(this.node);
    this.svg.selectAll('*').remove();
    this.root = this.svg.append('g').attr('class', 'root-yo');

    const radius = d3.scaleLinear()
      .domain([0, 40])
      .range([maxRadius, minRadius]);

    this.root.append('g')
      .attr('class', 'circles-yo')
      .selectAll('circle')
      .data(data.planets)
      .enter()
      .append('circle')
      .attr("cx", (p) => x(p.x))
      .attr("cy", (p) => y(p.y))
      .attr("r", (p) => Math.min(Math.max(radius(this.props.data.planets.length), minRadius), maxRadius))
      .attr("fill", (p) => p.owner ? color(p.owner.toString()) : "#ffffff")
      .classed(css.emptyPlanet, (p) => !p.owner);

    if (this.props.data.selected) {
      this.root.append('g')
        .append('text')
        .attr('x', '0')
        .attr('y', '99')
        .classed(css.selectedText, true)
        .text("\uf00c");
    }
  }

  protected updateGraph(): void {
    this.createGraph();
  }
}

export interface MapPreviewProps {
  selectedMap?: M.MapMeta;
  selected: boolean;
  selectMap: () => void;
}

export interface MapPreviewState {
  map?: M.GameMap | Error;
}

export class MapPreview extends React.Component<MapPreviewProps, MapPreviewState> {

  constructor(props: MapPreviewProps) {
    super(props);
    this.state = {
      map: undefined,
    };
  }

  public componentDidMount() {
    this.update(this.props);
  }

  public componentDidUpdate(prevProps: MapPreviewProps) {
    const meta = this.props.selectedMap;
    const prev = prevProps.selectedMap;
    if (!meta) { this.setState({ map: undefined }); return; }
    if (!prev) { this.update(this.props); return; }
    if (meta.uuid === prev.uuid) { return; }
    this.update(this.props);
  }

  public render() {
    const planets: StaticPlanet[] = M.isGameMap(this.state.map) ?
      this.state.map.planets.map((planet: JsonPlanet, index: number) => {
        return {
          ...planet,
          index,
        };
      }) :
      [];
    let [minX, maxX] = d3.extent(planets, (planet: StaticPlanet) => planet.x);
    let [minY, maxY] = d3.extent(planets, (planet: StaticPlanet) => planet.y);
    [minX, maxX] = [minX || 0, maxX || 0];
    [minY, maxY] = [minY || 0, maxY || 0];
    const data: MapViewData = {
      planets,
      selected: this.props.selected,
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY },
    };

    return (
      <div
        className={css.mapPreview + " " + (this.props.selected ? css.selectedMap : css.notSelectedMap)}
        onClick={this.props.selectMap}
      >
        <div className={css.map}>
          <MapView data={data} width={100} height={100} />
        </div>
      </div>
    );
  }

  private update(props: MapPreviewProps) {
    const meta = this.props.selectedMap;
    if (!meta) { this.setState({ map: undefined }); return; }

    fs.readFile(meta.mapPath, (err, data) => {
      if (err) { this.setState({ map: err }); return; }
      try {
        const input = JSON.parse(data.toString());
        const map = M.isGameMap(input) ? input : new Error('Map is not valid');
        this.setState({ map });
      } catch (err) {
        this.setState({ map: err });
      }
    });
  }
}

export interface ImportMapProps {
  importMap: () => void;
}

export class ImportMap extends React.Component<ImportMapProps, {}> {
  public render() {
    return (
      <div
        className={css.mapPreview + " " + css.notSelectedMap}
        onClick={this.props.importMap}
      >
        <div className={css.map}>
          <i className={"fa fa-plus-circle " + css.importCircle} />
        </div>
      </div>
    );
  }
}

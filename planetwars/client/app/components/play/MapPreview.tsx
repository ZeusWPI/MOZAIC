import * as React from 'react';
import * as d3 from 'd3';

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

export interface GraphProps<T> {
    data: T;
    width: number;
    height: number;
  }

export abstract class Graph<T> extends React.Component<GraphProps<T>> {
    protected node: SVGSVGElement;
  
    constructor(props: GraphProps<T>) {
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
            ref={(node: SVGSVGElement) => this.node = node
            }
            width={this.props.width}
            height={this.props.height}
          />
        </div>
      );
    }
  
    protected abstract createGraph(): void;
  
    protected abstract updateGraph(): void;
  }

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
  }

  export class MapViewGraph extends Graph<MapViewData> {
    private svg: d3.Selection<SVGSVGElement, {}, null, undefined>;
    private root: d3.Selection<d3.BaseType, {}, null, undefined>;
  
    protected createGraph(): void {
      const { data, width, height } = this.props;
      const { min, max, planets } = data;
  
      const minRadius = 1;
      const maxRadius = 10;
  
      const x = d3.scaleLinear()
        .domain([min.x, max.x])
        .range([0 + maxRadius, width - maxRadius]);
  
      const y = d3.scaleLinear()
        .domain([min.y, max.y])
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
        .attr("r", (p) => radius(this.props.data.planets.length))
        .attr("fill", (p) => p.owner ? color(p.owner.toString()) : "#ffffff")
    }
  
    protected updateGraph(): void {
      this.createGraph();
    }
  }
  
  

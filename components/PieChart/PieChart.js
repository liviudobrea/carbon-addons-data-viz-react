import PropTypes from 'prop-types';
import React, { Component } from 'react';
import DataTooltip from '../DataTooltip/DataTooltip';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactDOM from 'react-dom';

const propTypes = {
  data: PropTypes.array,
  radius: PropTypes.number,
  formatValue: PropTypes.func,
  formatTooltipData: PropTypes.func,
  id: PropTypes.string,
  color: PropTypes.array,
  onHover: PropTypes.func,
  showTotals: PropTypes.bool,
  showTooltip: PropTypes.bool,
};

const defaultProps = {
  data: [['Gryffindor', 100]],
  radius: 96,
  formatValue: value => value,
  formatTooltipData: ({ data: [label, value], color }) => {
    return [
      {
        data: value,
        label: label,
        color: color,
      },
    ];
  },
  color: ['#00a68f', '#3b1a40', '#473793', '#3c6df0', '#56D2BB'],
  id: 'graph-container',
  showTotals: false,
  showTooltip: true,
};

class PieChart extends Component {
  componentDidMount() {
    this.width = this.props.radius * 2;
    this.height = this.props.radius * 2 + 24;

    this.renderSVG();
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      this.renderSVG(nextProps);
    }
  }

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(this.props, nextProps);
  }

  renderSVG() {
    const {
      data,
      radius,
      formatValue,
      formatTooltipData,
      id,
      onHover,
      showTotals,
      showTooltip,
    } = this.props;
    const color = d3.scaleOrdinal(this.props.color);
    const tooltipId = this.tooltipId;
    const pie = d3
      .pie()
      .sort(null)
      .value(d => d[1]);
    const path = d3
      .arc()
      .outerRadius(radius - 10)
      .innerRadius(radius - 40);
    const pathTwo = d3
      .arc()
      .outerRadius(radius)
      .innerRadius(radius - 40);

    if (this.svg) {
      const paths = this.svg.selectAll('path');
      if (paths.size()) {
        this.svg.remove();
      }
    }

    this.svg = d3
      .select(this.svgNode)
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('class', 'group-container')
      .attr('transform', `translate(${this.width / 2}, ${this.height / 2})`);

    if (showTotals) {
      this.renderTooltip();
    }

    const updateTextStyles = this.updateTextStyles.bind(this);

    const arc = this.svg
      .selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arc
      .append('path')
      .attr('fill', (d, i) => color(i))
      .attr('stroke-width', 2)
      .attr('stroke', '#FFFFFF')
      .transition()
      .ease(d3.easeQuadOut)
      .duration(650)
      .attrTween('d', d => {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return t => path(i(t));
      });

    const totalAmount = data.reduce((acc, values) => (acc += values[1]), 0);

    if (showTotals) {
      this.svg.select(`.bx--pie-tooltip`).style('display', 'block');
      this.svg.select(`.bx--pie-key`).text('Total');
      this.svg.select(`.bx--pie-value`).text(`${formatValue(totalAmount)}`);
      this.updateTextStyles();
    }

    this.svg
      .selectAll('path')
      .on('mouseover', function(d) {
        d3.select(this)
          .transition()
          .style('cursor', 'pointer')
          .attr('d', pathTwo);

        d3.select(`#${id} .bx--pie-tooltip`).style('display', 'inherit');
        d3.select(`#${id} .bx--pie-key`).text(`${d.data[0]}`);
        d3.select(`#${id} .bx--pie-value`).text(`${formatValue(d.data[1])}`);
        updateTextStyles();
        if (onHover) {
          onHover(true, d.data[0]);
        }
        if (showTooltip) {
          const tooltipData = formatTooltipData({
            data: d.data,
            color: color(d.index),
          });

          ReactDOM.render(<DataTooltip data={tooltipData} />, tooltipId);

          const tooltipSize = d3
            .select(tooltipId.children[0])
            .node()
            .getBoundingClientRect();
          const pos = path.centroid(d); //[x, y]
          let leftPos = pos[0] + (tooltipSize.width * pos[0]) / 100;
          let topPos = pos[1];
          if (pos[1] < 0) {
            topPos -= tooltipSize.height;
          } else {
            topPos += tooltipSize.height;
          }
          d3.select(tooltipId)
            .style('position', 'absolute')
            .style('top', `50%`)
            .style('left', `50%`)
            .style('transform', 'translate(-50%, -50%)')
            .style('width', `${tooltipSize.width}px`)
            .style('height', `${tooltipSize.height}px`)
            .selectAll('.bx--tooltip')
            .style('left', `calc(${leftPos}px)`)
            .style('top', `${topPos}px`);
        }
      })
      .on('mouseout', function() {
        d3.select(`#${id} .bx--pie-tooltip`).style(
          'display',
          !showTotals && 'none'
        );
        d3.select(this)
          .transition()
          .attr('d', path);
        if (showTotals) {
          d3.select(`#${id} .bx--pie-tooltip`).style('display', 'block');
          d3.select(`#${id} .bx--pie-key`).text('Total');
          d3.select(`#${id} .bx--pie-value`).text(
            `${formatValue(totalAmount)}`
          );
          updateTextStyles();
        }

        if (onHover) {
          onHover(false);
        }
        ReactDOM.unmountComponentAtNode(tooltipId);
      });
  }

  updateTextStyles() {
    const tooltip = this.svg.select('.bx--pie-tooltip');
    tooltip.select('.bx--pie-value').attr('x', (d, i, text) => {
      return -text[0].getBBox().width / 2;
    });

    tooltip
      .select('.bx--pie-key')
      .attr('x', (d, i, text) => {
        return -text[0].getBBox().width / 2;
      })
      .attr('y', (d, i, text) => {
        return text[0].getBBox().height;
      });
  }

  renderTooltip() {
    const tooltip = this.svg
      .append('g')
      .attr('class', 'bx--pie-tooltip')
      .style('display', 'none')
      .attr('x', this.width / 2)
      .attr('y', this.height / 2);

    tooltip
      .append('text')
      .attr('class', 'bx--pie-value')
      .style('font-size', '29px')
      .style('line-height', 1)
      .style('font-weight', '300');

    tooltip
      .append('text')
      .attr('class', 'bx--pie-key')
      .style('font-size', '14px')
      .style('color', '#5A6872')
      .style('font-weight', '400');
  }

  render() {
    const { id } = this.props;

    this.renderSVG();

    return (
      <div
        className="bx--graph-container"
        id={id}
        style={{
          position: 'relative',
          width: this.width,
          height: this.height,
        }}>
        <svg ref={node => (this.svgNode = node)} />
        <div
          className="bx--graph-tooltip"
          id="tooltip-div"
          ref={id => (this.tooltipId = id)}
        />
      </div>
    );
  }
}

PieChart.propTypes = propTypes;
PieChart.defaultProps = defaultProps;

export default PieChart;

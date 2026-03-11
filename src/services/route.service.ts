import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '../models/entities/route.entity';
import { CreateRouteDto } from '../models/dto/create-route.dto';
import { HashIdService } from './hash-id.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { NavigationEvents } from '../events/navigation.events';

@Injectable()
export class RouteService {
  private readonly logger = new Logger(RouteService.name);

  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    private readonly hashIdService: HashIdService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * List all routes for an organization.
   */
  async findAllByOrganization(orgId: string): Promise<Route[]> {
    return this.routeRepository.find({
      where: { organizationHashId: orgId },
      order: { path: 'ASC' },
    });
  }

  /**
   * Register a new route within an organization.
   */
  async create(orgId: string, dto: CreateRouteDto): Promise<Route> {
    const hashId = this.hashIdService.generate('RTE');

    const route = this.routeRepository.create({
      hashId,
      path: dto.path,
      frontendPath: dto.frontendPath,
      backendPath: dto.backendPath,
      method: dto.method || 'GET',
      privilegeCode: dto.privilegeCode || null,
      organizationHashId: orgId,
    });

    await this.routeRepository.save(route);

    await this.eventPublisher.publish(
      NavigationEvents.ROUTE_REGISTERED,
      'O',
      orgId,
      {
        routeHashId: route.hashId,
        path: route.path,
        method: route.method,
        organizationHashId: orgId,
      },
    );

    this.logger.log(`Registered route ${route.hashId} (${route.method} ${route.path}) in organization ${orgId}`);
    return route;
  }

  /**
   * Remove a route by hashId within an organization.
   */
  async remove(orgId: string, routeHashId: string): Promise<void> {
    const route = await this.routeRepository.findOne({
      where: { hashId: routeHashId, organizationHashId: orgId },
    });

    if (!route) {
      throw new NotFoundException(
        `Route ${routeHashId} not found in organization ${orgId}`,
      );
    }

    await this.routeRepository.remove(route);

    await this.eventPublisher.publish(
      NavigationEvents.ROUTE_REMOVED,
      'O',
      orgId,
      {
        routeHashId,
        path: route.path,
        method: route.method,
      },
    );

    this.logger.log(`Removed route ${routeHashId} from organization ${orgId}`);
  }
}
